#include <jni.h>
#include "ClarinetEngine.h"

#include <memory>
#include <mutex>

namespace {
std::unique_ptr<ClarinetEngine> gEngine;
std::mutex gEngineMutex;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_faisalaja92_sf2engine_NativeClarinetPlugin_nativeStart(
    JNIEnv*, jobject) {
    std::lock_guard<std::mutex> lock(gEngineMutex);
    if (!gEngine) gEngine = std::make_unique<ClarinetEngine>();
    return gEngine->start() ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT void JNICALL
Java_com_faisalaja92_sf2engine_NativeClarinetPlugin_nativeStop(
    JNIEnv*, jobject) {
    std::lock_guard<std::mutex> lock(gEngineMutex);
    if (gEngine) gEngine->stop();
}

extern "C" JNIEXPORT void JNICALL
Java_com_faisalaja92_sf2engine_NativeClarinetPlugin_nativeNoteOn(
    JNIEnv*, jobject, jint note, jfloat velocity) {
    std::lock_guard<std::mutex> lock(gEngineMutex);
    if (gEngine) gEngine->noteOn(note, velocity);
}

extern "C" JNIEXPORT void JNICALL
Java_com_faisalaja92_sf2engine_NativeClarinetPlugin_nativeNoteOff(
    JNIEnv*, jobject) {
    std::lock_guard<std::mutex> lock(gEngineMutex);
    if (gEngine) gEngine->noteOff();
}

extern "C" JNIEXPORT void JNICALL
Java_com_faisalaja92_sf2engine_NativeClarinetPlugin_nativeSetBreath(
    JNIEnv*, jobject, jfloat value) {
    std::lock_guard<std::mutex> lock(gEngineMutex);
    if (gEngine) gEngine->setBreath(value);
}
