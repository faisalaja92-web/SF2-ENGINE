#pragma once

#include <atomic>
#include <memory>
#include <mutex>
#include <vector>
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

    std::shared_ptr<oboe::AudioStream> stream_;
    std::mutex streamMutex_;
    std::vector<float> boreDelay_;
    size_t delayWrite_ = 0;
    double sampleRate_ = 48000.0;
    float frequency_ = 220.0f;
    float velocity_ = 0.8f;
    std::atomic<float> breath_{0.72f};
    std::atomic<bool> gate_{false};
    float envelope_ = 0.0f;
    float previousPressure_ = 0.0f;
    uint32_t noiseState_ = 0x12345678u;
};
