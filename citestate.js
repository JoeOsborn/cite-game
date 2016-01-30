(function () {
    window.CiteState = {};

    var NES = "NES";
    var SNES = "SNES";
    var DOS = "DOS";

    var FCEUX = "FCEUX";
    var SNES9X = "SNES9X";
    var DOSBOX = "DOSBOX";

    var EmulatorNames = {};
    EmulatorNames[NES] = FCEUX;
    EmulatorNames[SNES] = SNES9X;
    EmulatorNames[DOS] = DOSBOX;

    var LoadedEmulators = {};

    var EmulatorInstances = {};
    EmulatorInstances[FCEUX] = [];
    EmulatorInstances[SNES9X] = [];
    EmulatorInstances[DOSBOX] = [];

    function determineSystem(gameFile) {
        if (gameFile.match(/\.(smc|sfc)$/i)) {
            return SNES;
        } else if (gameFile.match(/\.exe$/i)) {
            return DOS;
        } else if (gameFile.match(/\.nes$/i)) {
            return NES;
        }
        throw new Error("Unrecognized System");
    }

    function realCite(targetID, onLoad, system, emulator, gameFile, freezeFile, otherFiles) {
        var emuModule = LoadedEmulators[emulator];
        if (!emuModule) {
            throw new Error("Emulator Not Loaded");
        }
        //todo: compile everybody with -s modularize and export name to FCEUX, SNES9X, DOSBOX.
        //todo: and be sure that gameFile, freezeFile, and extraFiles are used appropriately.
        var moduleObject = {
            locateFile: function(url) {
                if(url == emulator+".js.mem") {
                    return "/emulators/"+emulator+".js.mem";
                }
                return url;
            },
            targetID:targetID,
            system:system,
            emulator:emulator,
            gameFile:gameFile,
            freezeFile:freezeFile,
            extraFiles:otherFiles,
            preRun: [],
            postRun: [],
            print: console.log,
            printErr: console.error,

            canvas: (function() {
                var targetElement = document.getElementById(targetID);
                targetElement.innerHTML = "";
                var canvas = document.createElement("canvas");
                targetElement.appendChild(canvas);

                // As a default initial behavior, pop up an alert when webgl context is lost. To make your
                // application robust, you may want to override this behavior before shipping!
                // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
                canvas.addEventListener("webglcontextlost", function(e) {
                    alert('WebGL context lost. You will need to destroy and recreate this widget.');
                    e.preventDefault();
                }, false);

                return canvas;
            })()
        };
        var instance = emuModule(moduleObject);
        EmulatorInstances[emulator].push(instance);
        if(onLoad) {
            onLoad(instance);
        }
        return instance;
    }

    //the loaded emulator instance will implement saveState(cb), saveExtraFiles(cb), and loadState(s,cb)
    window.CiteState.cite = function (targetID, onLoad, gameFile, freezeFile, otherFiles) {
        var system = determineSystem(gameFile);
        var emulator = EmulatorNames[system];
        if (!(emulator in LoadedEmulators)) {
            var script = "emulators/" + emulator + ".js";
            //load the script on the page
            var scriptElement = document.createElement("script");
            scriptElement.src = script;
            scriptElement.onload = function () {
                LoadedEmulators[emulator] = window[emulator];
                realCite(targetID, onLoad, system, emulator, gameFile, freezeFile, otherFiles);
            };
            document.body.appendChild(scriptElement);
        } else {
            realCite(targetID, onLoad, system, emulator, gameFile, freezeFile, otherFiles);
        }
    }
})();


