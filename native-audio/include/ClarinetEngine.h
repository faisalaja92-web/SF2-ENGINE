#pragma once

#include <array>
#include <atomic>
#include <cstdint>
#include <memory>
#include <mutex>
#include <oboe/Oboe.h>

class ClarinetEngine final : public oboe::AudioStreamDataCallback,
                             public oboe::AudioStreamErrorCallback {
public:
    ClarinetEngine() = default;
    ~ClarinetEngine() override;

    bool start();
    void stop();
    void noteOn(int midiNote, float velocity);
    void noteOff();
    void setBreath(float value);

    oboe::DataCallbackResult onAudioReady(
        oboe::AudioStream* stream, void* audioData, int32_t numFrames) override;
    void onErrorAfterClose(oboe::AudioStream* stream, oboe::Result error) override;

private:
    void resetVoice(double sampleRate);
    float renderSample();

    static constexpr size_t kMaxDelaySamples = 4096;
    std::shared_ptr<oboe::AudioStream> stream_;
    std::mutex streamMutex_;
    std::array<float, kMaxDelaySamples> boreDelay_{};
    size_t delayLength_ = 1024;
    size_t delayWrite_ = 0;
    double sampleRate_ = 48000.0;
    float frequency_ = 220.0f;
    float velocity_ = 0.8f;
    std::atomic<float> breath_{0.72f};
    std::atomic<bool> gate_{false};
    std::atomic<int> requestedNote_{-1};
    std::atomic<float> requestedVelocity_{0.8f};
    int activeNote_ = -1;
    float envelope_ = 0.0f;
    float previousPressure_ = 0.0f;
    uint32_t noiseState_ = 0x12345678u;
};
