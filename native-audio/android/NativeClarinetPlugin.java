package com.faisalaja92.sf2engine;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeClarinet")
public class NativeClarinetPlugin extends Plugin {
    static {
        System.loadLibrary("nativeclarinet");
    }

    private native boolean nativeStart();
    private native void nativeStop();
    private native void nativeNoteOn(int note, float velocity);
    private native void nativeNoteOff();
    private native void nativeSetBreath(float value);

    @PluginMethod
    public void start(PluginCall call) {
        try {
            boolean started = nativeStart();
            if (!started) {
                call.reject("Native clarinet audio stream could not start.");
                return;
            }
            call.resolve();
        } catch (UnsatisfiedLinkError error) {
            call.reject("Native audio library is not available.");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        nativeStop();
        call.resolve();
    }

    @PluginMethod
    public void noteOn(PluginCall call) {
        Integer note = call.getInt("note");
        Double velocity = call.getDouble("velocity", 0.8);
        if (note == null || note < 0 || note > 127) {
            call.reject("MIDI note must be between 0 and 127.");
            return;
        }
        nativeNoteOn(note, (float) Math.max(0.0, Math.min(1.0, velocity)));
        call.resolve();
    }

    @PluginMethod
    public void noteOff(PluginCall call) {
        nativeNoteOff();
        call.resolve();
    }

    @PluginMethod
    public void setBreath(PluginCall call) {
        Double value = call.getDouble("value");
        if (value == null) {
            call.reject("Breath value is required.");
            return;
        }
        nativeSetBreath((float) Math.max(0.0, Math.min(1.0, value)));
        call.resolve();
    }
}
