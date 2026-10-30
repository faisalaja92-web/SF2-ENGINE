#include "ClarinetEngine.h"

#include <algorithm>
#include <cmath>

namespace {
constexpr float kBoreLoss = 0.9965f;
constexpr float kOutputGain = 0.18f;
}

ClarinetEngine::~ClarinetEngine() {
    stop();
}

bool ClarinetEngine::start() {
    std::lock_guard<std::mutex> lock(streamMutex_);
    if (stream_ && stream_->getState() == oboe::StreamState::Started) {
        return true;
    }

    oboe::AudioStreamBuilder builder;
    builder.setDirection(oboe::Direction::Output)
        ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
        ->setSharingMode(oboe::SharingMode::Shared)
        ->setFormat(oboe::AudioFormat::Float)
        ->setChannelCount(oboe::ChannelCount::Stereo)
        ->setSampleRate(48000)
        ->setDataCallback(this)
        ->setErrorCallback(this);

    oboe::Result result = builder.openStream(stream_);
    if (result != oboe::Result::OK || !stream_) {
        stream_.reset();
        return false;
    }

    sampleRate_ = static_cast<double>(stream_->getSampleRate());
    resetVoice(sampleRate_);
    result = stream_->requestStart();
    if (result != oboe::Result::OK) {
        stream_->close();
        stream_.reset();
        return false;
    }
    return true;
}

void ClarinetEngine::stop() {
    std::lock_guard<std::mutex> lock(streamMutex_);
    gate_.store(false);
    if (stream_) {
        stream_->requestStop();
        stream_->close();
        stream_.reset();
    }
}

void ClarinetEngine::resetVoice(double sampleRate) {
    sampleRate_ = sampleRate > 0.0 ? sampleRate : 48000.0;
    // A closed-open clarinet bore has a round-trip delay of approximately one period.
    delayLength_ = static_cast<size_t>(std::clamp(
        sampleRate_ / static_cast<double>(frequency_),
        8.0, static_cast<double>(kMaxDelaySamples)));
    boreDelay_.fill(0.0f);
    delayWrite_ = 0;
    envelope_ = 0.0f;
    previousPressure_ = 0.0f;
}

void ClarinetEngine::noteOn(int midiNote, float velocity) {
    requestedVelocity_.store(std::clamp(velocity, 0.0f, 1.0f));
    requestedNote_.store(std::clamp(midiNote, 36, 96));
    gate_.store(true);
}

void ClarinetEngine::noteOff() {
    gate_.store(false);
}

void ClarinetEngine::setBreath(float value) {
    breath_.store(std::clamp(value, 0.0f, 1.0f));
}

float ClarinetEngine::renderSample() {
    const int requested = requestedNote_.load();
    if (requested >= 0 && requested != activeNote_) {
        activeNote_ = requested;
        frequency_ = 440.0f * std::pow(
            2.0f, (static_cast<float>(activeNote_) - 69.0f) / 12.0f);
        velocity_ = requestedVelocity_.load();
        resetVoice(sampleRate_);
    } else {
        velocity_ = requestedVelocity_.load();
    }

    const bool gate = gate_.load();
    const float targetEnvelope = gate ? 1.0f : 0.0f;
    const float coefficient = gate ? 0.0018f : 0.00045f;
    envelope_ += (targetEnvelope - envelope_) * coefficient;

    const float incoming = boreDelay_[delayWrite_];
    const float airPressure = breath_.load() * velocity_ * envelope_;
    const float differential = airPressure - incoming;

    // Simplified single-reed pressure/flow non-linearity; this is not yet a
    // complete instrument model with tone-hole geometry and register venting.
    const float reedOpening = std::clamp(0.78f - 0.92f * differential, 0.0f, 1.0f);
    const float reedFlow = reedOpening * std::sqrt(std::abs(differential) + 1.0e-6f)
                           * (differential >= 0.0f ? 1.0f : -1.0f);

    noiseState_ = noiseState_ * 1664525u + 1013904223u;
    const float breathNoise =
        (static_cast<float>((noiseState_ >> 8) & 0xffffu) / 32768.0f - 1.0f)
        * 0.0015f * airPressure;

    const float reflected = std::tanh(reedFlow * 2.2f + breathNoise);
    boreDelay_[delayWrite_] = std::clamp(reflected * kBoreLoss, -0.98f, 0.98f);
    delayWrite_ = (delayWrite_ + 1) % delayLength_;

    const float output = (incoming - previousPressure_) * 0.55f + incoming * 0.45f;
    previousPressure_ = incoming;
    return std::clamp(output * envelope_ * kOutputGain, -0.9f, 0.9f);
}

oboe::DataCallbackResult ClarinetEngine::onAudioReady(
    oboe::AudioStream*, void* audioData, int32_t numFrames) {
    auto* output = static_cast<float*>(audioData);
    for (int32_t frame = 0; frame < numFrames; ++frame) {
        const float sample = renderSample();
        output[frame * 2] = sample;
        output[frame * 2 + 1] = sample;
    }
    return oboe::DataCallbackResult::Continue;
}

void ClarinetEngine::onErrorAfterClose(oboe::AudioStream*, oboe::Result) {
    gate_.store(false);
}
