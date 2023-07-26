import { Buffer } from "buffer";
import * as process from "process";
window.process = process;
(window as any).global = window;
global.Buffer = global.Buffer || Buffer;
