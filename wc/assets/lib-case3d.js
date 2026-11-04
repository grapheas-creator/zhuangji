
/* ===== Case3D 工作台 3D 机箱 ===== */
/*!
 * Case3D v2.4.0 — 装机生意工作台 3D 机箱预览模块（真实尺寸/参考图镜像）
 * 单文件、零依赖，复用页面全局 THREE r160；无 WebGL / 初始化失败时 mount() 返回 null，调用方保留 SVG。
 * 坐标（世界坐标直接烘焙）：+X 右 / -X 左（整面玻璃）/ +Y 上 / +Z 背面（前面板 -Z）；默认显示按参考图水平镜像
 * 机箱：W0.93 × H2.0 × D2.09（225mm/单位）；真实尺寸件；内部靠 +Z 背板
 * API: Case3D.mount(container, opts) → { sync(build), setPowered(bool), destroy(), getState(), getStats(), getLayout(), resize() }
 * 材质共享 + 按材质合并静态网格；程序化 canvas 纹理与环境反射；无外部资源、无网络请求。
 */
(function (root) {
'use strict';
var VERSION = '2.4.0';
var current = null;
var API = {
version: VERSION,
mount: mount,
sync: sync,
setPowered: setPowered,
destroy: destroy,
getState: getState,
getStats: getStats,
getLayout: getLayout
};
function warn(msg, e) {
try { if (root.console && root.console.warn) root.console.warn('[Case3D] ' + msg, e || ''); } catch (_) {}
}
function now() {
try { return (root.performance && root.performance.now) ? root.performance.now() : Date.now(); } catch (_) { return Date.now(); }
}
function num(v, d) { v = +v; return isFinite(v) ? v : d; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function partOf(b, k) { var v = b && b[k]; return v && v.part ? v.part : (v || null); }
function entry(b, k) { return (b && b[k]) || null; }
function resolveEl(el, doc) {
if (!el) return null;
if (typeof el === 'string') { try { return doc.querySelector(el); } catch (_) { return null; } }
return typeof el.appendChild === 'function' ? el : null;
}
function disposeList(arr) {
for (var i = 0; i < arr.length; i++) { try { arr[i].dispose && arr[i].dispose(); } catch (_) {} }
}
function mount(container, opts) {
destroy();
opts = opts || {};
try {
var view = create(container, opts);
if (!view) return null;
current = view;
if (opts.build) view.sync(opts.build);
if (opts.powered !== undefined) view.setPowered(!!opts.powered);
return view;
} catch (e) {
warn('mount 失败，保留 2D SVG 回退', e);
destroy();
return null;
}
}
function create(container, opts) {
var doc = opts.document || (container && container.ownerDocument) || root.document;
if (!doc) { warn('没有 document'); return null; }
var host = resolveEl(container, doc);
if (!host) { warn('container 不存在或不是 DOM 元素'); return null; }
var win = doc.defaultView || root;
var T = opts.THREE || root.THREE || (typeof THREE !== 'undefined' ? THREE : null);
if (!T) { warn('未找到全局 THREE，跳过 3D'); return null; }
var nav = win.navigator || {};
var autoLow = (num(nav.hardwareConcurrency, 8) <= 4) || (num(nav.deviceMemory, 8) <= 4);
var lowEnd = opts.lowEnd != null ? !!opts.lowEnd : autoLow;
var glassRefraction = opts.glass === 'refraction' || opts.glass === 'physical';
var glassMode = glassRefraction ? 'refraction' : 'clear';
var mirrorX = opts.mirror !== false;
var dprCap = num(opts.maxDpr, num(opts.dprCap, 0));
if (!dprCap) dprCap = lowEnd ? 1.5 : 2;
dprCap = clamp(dprCap, 1, 2);
var canvas = doc.createElement('canvas');
var attrs = { alpha: true, antialias: opts.antialias !== false, depth: true, stencil: false, powerPreference: 'high-performance' };
var gl = null;
try {
gl = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs) || canvas.getContext('experimental-webgl', attrs);
} catch (_) { gl = null; }
if (!gl) { warn('WebGL 不可用，跳过 3D'); return null; }
var renderer = null;
try {
renderer = new T.WebGLRenderer({
canvas: canvas, context: gl, alpha: true,
antialias: opts.antialias !== false, powerPreference: 'high-performance'
});
} catch (e) { warn('WebGLRenderer 创建失败，跳过 3D', e); return null; }
if (!renderer) return null;
var scene = null, camera = null, built = null, destroyed = false, envRT = null;
var hintEl = null, hintTimer = 0, ro = null;
var prevPosition = host.style.position;
var raf = 0, running = false, lastTs = 0, lastW = 0, lastH = 0;
var baseYaw = num(opts.baseYaw, -0.10), basePitch = num(opts.basePitch, -0.045);
var yaw = baseYaw, pitch = basePitch;
var homeYaw = yaw, homePitch = pitch;
var zoom = 1, zoomTarget = 1, powered = false, synced = false;
var recenterMs = Math.max(0, num(opts.recenterMs, 700));
var pointers = {}, pointerCount = 0, dragId = null, dragging = false, pinch = null, idleAt = 0;
var rgbTmp = null, palette = null, rgbLight = null, keyLight = null, fillLight = null, warmLight = null;
var ctrl = null;
var camPos = [-3.95, 1.12, -2.02];
function rafFn(cb) {
if (win.requestAnimationFrame) return win.requestAnimationFrame(cb);
return win.setTimeout(function () { cb(now()); }, 16);
}
function cafFn(id) {
try {
if (win.cancelAnimationFrame) win.cancelAnimationFrame(id);
else win.clearTimeout(id);
} catch (_) {}
}
function hideHint() {
if (!hintEl) return;
hintEl.style.opacity = '0';
if (hintTimer) { try { win.clearTimeout(hintTimer); } catch (_) {} hintTimer = 0; }
}
function updateRgb(t) {
if (!built || !built.rgbMat || !palette || !rgbTmp) return;
var cycle = 8.4, k = (t * 0.001) / cycle * 3;
var i = Math.floor(k) % 3, f = k - Math.floor(k);
f = f * f * (3 - 2 * f);
rgbTmp.copy(palette[i]).lerp(palette[(i + 1) % 3], f);
var mat = built.rgbMat;
mat.color.copy(rgbTmp);
mat.emissive.copy(rgbTmp);
var breath = 0.5 + 0.5 * Math.sin(t * 0.0021);
mat.emissiveIntensity = 1.6 + breath * 1.5;
if (rgbLight) {
rgbLight.color.copy(rgbTmp);
rgbLight.intensity = 1.6 + breath * 1.2;
}
}
function applyPower() {
var lit = powered && built && built.chassis.visible;
if (built && built.rgbMat) {
if (lit) updateRgb(now());
else {
built.rgbMat.emissive.setHex(0x000000);
built.rgbMat.emissiveIntensity = 0;
built.rgbMat.color.setHex(0x23262b);
}
}
if (built && built.accentMat) built.accentMat.emissiveIntensity = lit ? 0.7 : 0.03;
if (rgbLight) rgbLight.intensity = lit ? 2.4 : 0;
if (warmLight) warmLight.intensity = lit ? 7.5 : 2.4;
if (keyLight) keyLight.intensity = lit ? 2.7 : 2.2;
if (fillLight) fillLight.intensity = lit ? 0.95 : 0.62;
}
function measure() {
var w = Math.round(host.clientWidth || 0);
if (!w && host.getBoundingClientRect) { try { w = Math.round(host.getBoundingClientRect().width || 0); } catch (_) {} }
if (!w) w = 560;
var h = Math.round(host.clientHeight || 0);
if (!h) h = Math.round(w * 0.59);
return { w: Math.max(160, w), h: Math.max(120, h) };
}
function resize(force) {
if (destroyed || !renderer || !camera) return;
var s = measure();
var pr = Math.min(num(win.devicePixelRatio, 1) || 1, dprCap);
if (!force && s.w === lastW && s.h === lastH) return;
lastW = s.w; lastH = s.h;
try {
if (renderer.setPixelRatio) renderer.setPixelRatio(pr);
renderer.setSize(s.w, s.h, false);
} catch (_) {}
camera.aspect = s.w / s.h;
if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();
if (!running && scene) { try { renderer.render(scene, camera); } catch (_) {} }
}
function stop() {
running = false;
if (raf) { cafFn(raf); raf = 0; }
}
function drawFrame(ts) {
if (!running || destroyed) return;
raf = rafFn(drawFrame);
var t = num(ts, now());
if (t - lastTs < 15) return;
var dt = (t - lastTs) / 1000;
lastTs = t;
if (!(dt > 0)) dt = 0.016;
if (dt > 0.05) dt = 0.05;
if (!dragging && idleAt && t - idleAt >= recenterMs) {
var k = 1 - Math.exp(-dt * 2.1);
yaw += (homeYaw - yaw) * k;
pitch += (homePitch - pitch) * k;
if (Math.abs(yaw - homeYaw) < 0.0004) yaw = homeYaw;
if (Math.abs(pitch - homePitch) < 0.0004) pitch = homePitch;
}
zoom += (zoomTarget - zoom) * Math.min(1, dt * 10);
built.root.rotation.y = yaw;
built.root.rotation.x = pitch;
camera.position.set(camPos[0] * zoom, camPos[1] * zoom, camPos[2] * zoom);
camera.lookAt(0, 0, 0);
if (powered && built.chassis.visible) {
var fans = built.fans;
for (var i = 0; i < fans.length; i++) fans[i].b.rotation.z += dt * fans[i].s;
updateRgb(t);
}
try { renderer.render(scene, camera); } catch (e) { warn('render 失败，停止动画', e); stop(); }
}
function start() {
if (destroyed || running) return;
if (doc.hidden) return;
running = true;
lastTs = now();
raf = rafFn(drawFrame);
}
function onVisibility() { if (doc.hidden) stop(); else start(); }
function onResize() { resize(false); }
function twoPoints() {
var a = [], k;
for (k in pointers) if (Object.prototype.hasOwnProperty.call(pointers, k)) a.push(pointers[k]);
return a;
}
function distance() {
var a = twoPoints();
if (a.length < 2) return 0;
var dx = a[0].x - a[1].x, dy = a[0].y - a[1].y;
return Math.sqrt(dx * dx + dy * dy);
}
function pointerId(e) { return e.pointerId == null ? 1 : e.pointerId; }
function onDown(e) {
if (destroyed) return;
hideHint();
var id = pointerId(e);
pointers[id] = { x: num(e.clientX, 0), y: num(e.clientY, 0) };
pointerCount = twoPoints().length;
if (e.pointerId != null && canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
if (pointerCount === 1) {
dragId = id; dragging = true; idleAt = 0; pinch = null;
canvas.style.cursor = 'grabbing';
} else if (pointerCount >= 2) {
dragging = false; dragId = null;
pinch = { d: distance(), z: zoomTarget };
}
if (e.preventDefault) e.preventDefault();
}
function onMove(e) {
if (destroyed) return;
var id = pointerId(e), p = pointers[id];
if (!p) return;
var nx = num(e.clientX, p.x), ny = num(e.clientY, p.y);
var dx = nx - p.x, dy = ny - p.y;
if (mirrorX) dx = -dx;
p.x = nx; p.y = ny;
if (twoPoints().length >= 2) {
if (!pinch) pinch = { d: distance(), z: zoomTarget };
var d = distance();
if (pinch.d > 8) zoomTarget = clamp(pinch.z * (d / pinch.d), 0.72, 1.38);
return;
}
if (dragging && id === dragId) {
yaw += dx * 0.008;
pitch = clamp(pitch + dy * 0.005, -0.44, 0.30);
}
}
function release(e) {
if (e && e.pointerId != null) delete pointers[e.pointerId];
else pointers = {};
pointerCount = twoPoints().length;
if (pointerCount < 2) pinch = null;
if (!pointerCount) {
dragging = false; dragId = null; idleAt = now();
canvas.style.cursor = 'grab';
}
}
function onWheel(e) {
if (destroyed) return;
if (e.preventDefault) e.preventDefault();
zoomTarget = clamp(zoomTarget - num(e.deltaY, 0) * 0.00075, 0.72, 1.38);
hideHint();
}
function onDouble() {
yaw = homeYaw; pitch = homePitch; zoomTarget = 1; idleAt = 0;
zoom = 1;
}
try {
if (renderer.setClearColor) renderer.setClearColor(0x000000, 0);
if (T.SRGBColorSpace && renderer.outputColorSpace !== undefined) renderer.outputColorSpace = T.SRGBColorSpace;
if (T.ACESFilmicToneMapping && renderer.toneMapping !== undefined) renderer.toneMapping = T.ACESFilmicToneMapping;
if (renderer.toneMappingExposure !== undefined) renderer.toneMappingExposure = 1.18;
if (renderer.shadowMap) renderer.shadowMap.enabled = false;
if (renderer.setPixelRatio) renderer.setPixelRatio(Math.min(num(win.devicePixelRatio, 1) || 1, dprCap));
scene = new T.Scene();
camera = new T.PerspectiveCamera(30.8, 1, 0.1, 60);
camera.position.set(camPos[0], camPos[1], camPos[2]);
camera.lookAt(0, 0, 0);
if (opts.env !== false && T.PMREMGenerator) {
try { envRT = buildEnvironment(T, renderer, scene); } catch (e) { warn('环境反射生成失败，改为纯灯光', e); envRT = null; }
}
built = buildScene(T, scene, opts, doc, win, { refraction: glassRefraction, glassMode: glassMode, mirror: mirrorX, env: !!envRT });
rgbLight = built.rgbLight;
keyLight = built.keyLight;
fillLight = built.fillLight;
warmLight = built.warmLight;
rgbTmp = new T.Color();
palette = [new T.Color(0x2be0ff), new T.Color(0xff7a2e), new T.Color(0xa06bff)];
built.root.rotation.y = yaw;
built.root.rotation.x = pitch;
applyPower();
if (built.chassis.visible) updateRgb(now());
} catch (e) {
warn('场景构建失败，回退 SVG', e);
try { if (envRT) { envRT.dispose && envRT.dispose(); } } catch (_) {}
try { renderer.dispose && renderer.dispose(); } catch (_) {}
try { var lc = gl.getExtension && gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); } catch (_) {}
return null;
}
function sync(build) {
if (destroyed || !built) return false;
build = build || {};
var hasCase = !!entry(build, 'case');
var hasMb = hasCase && !!entry(build, 'mb');
var cpuEntry = entry(build, 'cpu'), cooler = partOf(build, 'cooler');
var isAio = num(cooler && cooler.rad, 0) > 0;
var rad = num(cooler && cooler.rad, 0);
built.chassis.visible = hasCase;
if (built.details) built.details.visible = hasCase;
built.stage.visible = hasCase;
built.inner.visible = hasCase;
built.mb.visible = hasMb;
built.cpu.visible = hasMb && !!cpuEntry;
built.coolerTower.visible = hasMb && !!cpuEntry && !!cooler && !isAio;
built.coolerAio.visible = hasMb && !!cpuEntry && !!cooler && isAio;
built.aioFan3.visible = hasMb && !!cpuEntry && !!cooler && isAio && rad >= 360;
built.psu.visible = hasCase && !!entry(build, 'psu');
if (built.wires) built.wires.visible = hasCase && !!entry(build, 'psu');
built.gpu1.visible = hasCase && !!entry(build, 'gpu1');
built.gpu2.visible = hasCase && !!entry(build, 'gpu2');
for (var i = 0; i < built.rams.length; i++) built.rams[i].visible = hasMb && !!(build.rams && build.rams[i]);
for (i = 0; i < built.m2.length; i++) built.m2[i].visible = hasMb && !!(build.m2 && build.m2[i]);
var sataN = 0;
if (build.sata) for (i = 0; i < build.sata.length; i++) if (build.sata[i]) sataN++;
for (i = 0; i < built.sata.length; i++) built.sata[i].visible = hasCase && i < sataN;
synced = true;
applyPower();
return true;
}
function setPowered(on) {
if (destroyed) return false;
powered = !!on;
applyPower();
return true;
}
function getState() {
var counts = { ram: 0, m2: 0, sata: 0 };
if (built) {
for (var i = 0; i < built.rams.length; i++) if (built.rams[i].visible) counts.ram++;
for (i = 0; i < built.m2.length; i++) if (built.m2[i].visible) counts.m2++;
for (i = 0; i < built.sata.length; i++) if (built.sata[i].visible) counts.sata++;
}
var glassFacing = 0;
if (built && built.glass && built.root) {
built.root.updateMatrixWorld(true);
var gn = new T.Vector3(0, 0, 1).transformDirection(built.glass.matrixWorld);
var gp = new T.Vector3().setFromMatrixPosition(built.glass.matrixWorld);
glassFacing = gn.dot(camera.position.clone().sub(gp).normalize());
}
return {
version: VERSION, mounted: !destroyed, powered: powered, synced: synced,
hasCase: !!(built && built.chassis.visible), yaw: yaw, pitch: pitch,
zoom: zoom, zoomTarget: zoomTarget, running: running,
glassMode: glassMode, glassFacing: glassFacing, mirrorX: mirrorX,
dpr: renderer && renderer.getPixelRatio ? renderer.getPixelRatio() : 0,
size: { w: lastW, h: lastH }, counts: counts
};
}
function getStats() {
if (destroyed || !scene) return null;
var triangles = 0, visibleTriangles = 0, meshes = 0, visibleMeshes = 0, mats = [], geos = [];
function chainVisible(o) {
while (o) { if (!o.visible) return false; o = o.parent; }
return true;
}
scene.traverse(function (o) {
if (!o.isMesh) return;
meshes++;
var vis = chainVisible(o);
if (vis) visibleMeshes++;
var g = o.geometry;
if (g) {
if (geos.indexOf(g) < 0) geos.push(g);
var t = (g.index && g.index.count) ? g.index.count / 3 : (g.attributes && g.attributes.position ? g.attributes.position.count / 3 : 0);
triangles += t;
if (vis) visibleTriangles += t;
}
var list = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
for (var i = 0; i < list.length; i++) if (mats.indexOf(list[i]) < 0) mats.push(list[i]);
});
return {
triangles: Math.round(triangles), visibleTriangles: Math.round(visibleTriangles),
materials: mats.length, geometries: geos.length,
meshes: meshes, visibleMeshes: visibleMeshes, drawCalls: visibleMeshes,
glassMode: glassMode, mirrorX: mirrorX, env: !!built.envMap,
dpr: renderer && renderer.getPixelRatio ? renderer.getPixelRatio() : 0
};
}
function getLayout() {
if (destroyed || !built || !built.layout) return null;
var out = {}, k;
for (k in built.layout) if (Object.prototype.hasOwnProperty.call(built.layout, k)) out[k] = built.layout[k].clone();
return out;
}
function destroy() {
if (destroyed) return;
destroyed = true;
stop();
if (hintTimer) { try { win.clearTimeout(hintTimer); } catch (_) {} hintTimer = 0; }
try { doc.removeEventListener('visibilitychange', onVisibility); } catch (_) {}
try { win.removeEventListener('resize', onResize); } catch (_) {}
if (ro && ro.disconnect) { try { ro.disconnect(); } catch (_) {} }
try {
canvas.removeEventListener('pointerdown', onDown);
canvas.removeEventListener('pointermove', onMove);
canvas.removeEventListener('pointerup', release);
canvas.removeEventListener('pointercancel', release);
canvas.removeEventListener('wheel', onWheel);
canvas.removeEventListener('dblclick', onDouble);
} catch (_) {}
if (scene) {
var geos = [], mats = [], texs = [];
scene.traverse(function (o) {
if (o.geometry && geos.indexOf(o.geometry) < 0) geos.push(o.geometry);
if (o.material) {
var list = Array.isArray(o.material) ? o.material : [o.material];
for (var i = 0; i < list.length; i++) {
var m = list[i];
if (mats.indexOf(m) < 0) mats.push(m);
if (m && m.map && texs.indexOf(m.map) < 0) texs.push(m.map);
if (m && m.alphaMap && texs.indexOf(m.alphaMap) < 0) texs.push(m.alphaMap);
}
}
});
disposeList(texs);
disposeList(geos);
disposeList(mats);
}
try { if (envRT) { if (envRT.texture) envRT.texture.dispose(); envRT.dispose && envRT.dispose(); } } catch (_) {}
try {
if (renderer.dispose) renderer.dispose();
if (renderer.forceContextLoss) renderer.forceContextLoss();
} catch (_) {}
try { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); } catch (_) {}
try { if (hintEl && hintEl.parentNode) hintEl.parentNode.removeChild(hintEl); } catch (_) {}
try { host.style.position = prevPosition; } catch (_) {}
if (current === ctrl) current = null;
}
ctrl = {
version: VERSION, canvas: canvas, renderer: renderer, scene: scene, camera: camera,
sync: sync, setPowered: setPowered, destroy: destroy, getState: getState, getStats: getStats, getLayout: getLayout, resize: resize
};
try {
canvas.width = 560; canvas.height = 330;
canvas.style.cssText = 'display:block;width:100%;height:auto;border-radius:12px;touch-action:pan-y;' +
'cursor:grab;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;' +
(mirrorX ? 'transform:scaleX(-1);transform-origin:center;' : '');
canvas.setAttribute('role', 'img');
canvas.setAttribute('aria-label', opts.ariaLabel || '3D 机箱预览，可拖动旋转');
hintEl = doc.createElement('div');
hintEl.className = 'case3d-hint';
hintEl.textContent = opts.hint || '拖动旋转 · 双击回正 · 滚轮缩放';
hintEl.style.cssText = 'position:absolute;right:10px;bottom:8px;z-index:6;pointer-events:none;font:10px/1.6 system-ui,sans-serif;' +
'letter-spacing:.4px;color:rgba(255,210,170,.62);background:rgba(10,9,8,.42);padding:3px 8px;border-radius:8px;transition:opacity .5s';
try { host.style.position = 'relative'; } catch (_) {}
while (host.firstChild) host.removeChild(host.firstChild);
host.appendChild(canvas);
host.appendChild(hintEl);
canvas.addEventListener('pointerdown', onDown, false);
canvas.addEventListener('pointermove', onMove, false);
canvas.addEventListener('pointerup', release, false);
canvas.addEventListener('pointercancel', release, false);
canvas.addEventListener('wheel', onWheel, { passive: false });
canvas.addEventListener('dblclick', onDouble, false);
try { doc.addEventListener('visibilitychange', onVisibility); } catch (_) {}
if (typeof win.ResizeObserver === 'function') {
try {
ro = new win.ResizeObserver(function () { resize(false); });
ro.observe(host);
} catch (_) { ro = null; }
}
if (!ro) { try { win.addEventListener('resize', onResize); } catch (_) {} }
hintTimer = win.setTimeout(hideHint, 6000);
resize(true);
start();
} catch (e) {
warn('DOM 挂载失败，回退 SVG', e);
destroy();
return null;
}
return ctrl;
}
function buildEnvironment(T, renderer, scene) {
var pmrem = new T.PMREMGenerator(renderer);
var envScene = new T.Scene();
var dis = [];
try {
var skyGeo = new T.SphereGeometry(24, 32, 16);
var pos = skyGeo.attributes.position;
var colors = new Float32Array(pos.count * 3);
for (var i = 0; i < pos.count; i++) {
var y = pos.getY(i) / 24;
var t = clamp((y + 1) * 0.5, 0, 1);
var r, g, b;
if (t < 0.5) {
var f = t / 0.5;
r = 0.045 + f * 0.21; g = 0.04 + f * 0.17; b = 0.04 + f * 0.16;
} else {
var f2 = (t - 0.5) / 0.5;
r = 0.255 - f2 * 0.075; g = 0.21 + f2 * 0.06; b = 0.20 + f2 * 0.17;
}
colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
}
skyGeo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
var skyMat = new T.MeshBasicMaterial({ side: T.BackSide, vertexColors: true, depthWrite: false, toneMapped: false });
var sky = new T.Mesh(skyGeo, skyMat);
envScene.add(sky);
dis.push(skyGeo, skyMat);
function panel(w, h, color, x, y, z) {
var g = new T.PlaneGeometry(w, h);
var m = new T.MeshBasicMaterial({ color: color, side: T.DoubleSide, toneMapped: false });
var mesh = new T.Mesh(g, m);
mesh.position.set(x, y, z);
mesh.lookAt(0, 0, 0);
envScene.add(mesh);
dis.push(g, m);
}
panel(7, 4.5, new T.Color(3.6, 3.2, 2.7), 7, 8, 7);
panel(5, 7, new T.Color(1.1, 1.7, 2.9), -9, 4, -3);
panel(8, 2.4, new T.Color(1.7, 1.85, 2.2), 0, 11, 0);
panel(4, 3, new T.Color(2.2, 1.05, 0.45), 3, 2.5, 9);
var rt = pmrem.fromScene(envScene, 0.035);
scene.environment = rt.texture;
return rt;
} finally {
for (var j = 0; j < dis.length; j++) { try { dis[j].dispose(); } catch (_) {} }
try { pmrem.dispose(); } catch (_) {}
}
}
function buildScene(T, scene, opts, doc, win, flags) {
var accentHex = opts.accent == null ? 0xff8a3c : opts.accent;
var fans = [], rams = [], m2s = [], satas = [];
var baseGeos = [];
var WORLD = new T.Matrix4().makeRotationY(Math.PI);
var WORLD_Q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI);
var G = {
box: new T.BoxGeometry(1, 1, 1),
cyl: new T.CylinderGeometry(1, 1, 1, 16),
cyl8: new T.CylinderGeometry(1, 1, 1, 8),
torus: new T.TorusGeometry(1, 0.06, 4, 18),
plane: new T.PlaneGeometry(1, 1),
circle: new T.CircleGeometry(1, 48)
};
baseGeos.push(G.box, G.cyl, G.cyl8, G.torus, G.plane);
function seeded(seed) {
var a = seed >>> 0;
return function () {
a += 0x6D2B79F5;
var t = a;
t = Math.imul(t ^ (t >>> 15), t | 1);
t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
}
function canvasTex(w, h, draw, o) {
o = o || {};
try {
var c = doc.createElement('canvas');
c.width = w; c.height = h;
var g = c.getContext('2d');
if (!g) return null;
draw(g, w, h);
if (flags.mirror) {
var c2 = doc.createElement('canvas');
c2.width = w; c2.height = h;
var g2 = c2.getContext('2d');
if (g2) {
g2.translate(w, 0); g2.scale(-1, 1); g2.drawImage(c, 0, 0);
c = c2;
}
}
var t = new T.CanvasTexture(c);
if (o.srgb && T.SRGBColorSpace && t.colorSpace !== undefined) t.colorSpace = T.SRGBColorSpace;
if (o.repeat && T.RepeatWrapping) {
t.wrapS = t.wrapT = T.RepeatWrapping;
t.repeat.set(o.repeat[0], o.repeat[1]);
}
t.needsUpdate = true;
return t;
} catch (e) { return null; }
}
var brushTex = canvasTex(128, 128, function (g, w, h) {
g.fillStyle = '#b8c0c7'; g.fillRect(0, 0, w, h);
var rnd = seeded(7);
for (var i = 0; i < 260; i++) {
var x = Math.floor(rnd() * w), y = rnd() * h, len = 14 + rnd() * 60;
g.strokeStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.055)' : 'rgba(35,42,50,0.06)';
g.lineWidth = 1;
g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + len); g.stroke();
}
}, { srgb: true, repeat: [2, 2] });
var pcbGreen = canvasTex(256, 320, function (g, w, h) {
g.fillStyle = '#0d3524'; g.fillRect(0, 0, w, h);
var rnd = seeded(23);
g.strokeStyle = 'rgba(120,200,155,0.20)'; g.lineWidth = 1;
for (var i = 0; i < 46; i++) {
var x = rnd() * w, y = rnd() * h;
g.beginPath(); g.moveTo(x, y);
for (var s = 0; s < 4; s++) {
if (rnd() > 0.5) x += (rnd() - 0.5) * 80; else y += (rnd() - 0.5) * 70;
g.lineTo(x, y);
}
g.stroke();
}
g.fillStyle = 'rgba(215,190,110,0.55)';
for (i = 0; i < 90; i++) { g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
g.strokeStyle = 'rgba(220,230,215,0.34)'; g.lineWidth = 1;
for (i = 0; i < 8; i++) {
var bx = 28 + rnd() * (w - 80), by = 30 + rnd() * (h - 90), bw = 14 + rnd() * 30, bh = 10 + rnd() * 22;
g.strokeRect(bx, by, bw, bh);
g.fillStyle = 'rgba(8,12,10,0.55)'; g.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
}
g.fillStyle = 'rgba(230,236,225,0.5)';
g.font = 'bold 11px system-ui, sans-serif';
g.fillText('NEXUS B760M', 16, h - 14);
g.fillText('REV 1.02', w - 68, 18);
}, { srgb: true });
var pcbDark = canvasTex(256, 256, function (g, w, h) {
g.fillStyle = '#14171b'; g.fillRect(0, 0, w, h);
var rnd = seeded(41);
g.strokeStyle = 'rgba(150,170,190,0.13)'; g.lineWidth = 1;
for (var i = 0; i < 36; i++) {
var x = rnd() * w, y = rnd() * h;
g.beginPath(); g.moveTo(x, y);
for (var s = 0; s < 3; s++) { x += (rnd() - 0.5) * 70; y += (rnd() - 0.5) * 60; g.lineTo(x, y); }
g.stroke();
}
g.fillStyle = 'rgba(212,182,100,0.4)';
for (i = 0; i < 60; i++) g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5);
g.fillStyle = 'rgba(220,226,235,0.28)';
g.font = 'bold 10px system-ui, sans-serif';
g.fillText('RTX', 14, 24);
}, { srgb: true });
var meshAlpha = canvasTex(192, 192, function (g, w, h) {
g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
g.fillStyle = '#000000';
var step = 12, r = 3.1;
for (var y = step / 2; y < h; y += step) {
for (var x = step / 2; x < w; x += step) {
g.beginPath(); g.arc(x + (((y / step) | 0) % 2 ? step / 2 : 0), y, r, 0, 6.2832); g.fill();
}
}
}, { repeat: [7, 9] });
var dustAlpha = canvasTex(128, 128, function (g, w, h) {
g.fillStyle = '#000000'; g.fillRect(0, 0, w, h);
g.strokeStyle = '#ffffff'; g.lineWidth = 1.2;
for (var i = 4; i < w; i += 8) {
g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
}
}, { repeat: [5, 3] });
var bladeTex = canvasTex(192, 192, function (g, w, h) {
g.clearRect(0, 0, w, h);
g.translate(w / 2, h / 2);
for (var i = 0; i < 7; i++) {
g.save(); g.rotate((Math.PI * 2 / 7) * i);
var grad = g.createLinearGradient(0, 8, 0, 78);
grad.addColorStop(0, '#6d7782');
grad.addColorStop(0.45, '#3a424b');
grad.addColorStop(1, '#20252b');
g.fillStyle = grad;
g.beginPath();
g.moveTo(-3, 9);
g.quadraticCurveTo(-20, 38, -13, 74);
g.quadraticCurveTo(-2, 84, 4, 70);
g.quadraticCurveTo(13, 40, 3, 9);
g.closePath(); g.fill();
g.restore();
}
g.fillStyle = 'rgba(160,170,180,0.4)';
g.beginPath(); g.arc(0, 0, 11, 0, 6.2832); g.fill();
}, { srgb: true });
var psuLabelTex = canvasTex(256, 128, function (g, w, h) {
g.fillStyle = '#101215'; g.fillRect(0, 0, w, h);
g.fillStyle = '#e8e2d6'; g.font = 'bold 24px system-ui, sans-serif';
g.fillText('NEXUS', 16, 36);
g.fillStyle = '#ff9b45'; g.font = 'bold 13px system-ui, sans-serif';
g.fillText('850W  GOLD', 16, 60);
g.strokeStyle = 'rgba(255,180,100,.55)'; g.lineWidth = 2;
g.strokeRect(184, 20, 52, 52);
g.fillStyle = 'rgba(255,190,110,.8)'; g.font = 'bold 14px system-ui, sans-serif';
g.fillText('80+', 193, 52);
g.fillStyle = 'rgba(200,210,220,.35)'; g.font = '10px system-ui, sans-serif';
g.fillText('FULLY MODULAR · ATX 3.0 · 12VHPWR', 16, 92);
g.fillStyle = 'rgba(160,170,180,.25)';
for (var i = 0; i < 32; i++) g.fillRect(16 + i * 7, 104, 3, 8);
}, { srgb: true });
var brandTex = canvasTex(192, 48, function (g, w, h) {
g.clearRect(0, 0, w, h);
g.fillStyle = 'rgba(235,230,220,.9)'; g.font = 'bold 22px system-ui, sans-serif';
g.fillText('N E X U S', 18, 30);
g.fillStyle = '#ff9b45'; g.fillRect(0, 18, 8, 4);
}, { srgb: true });
var shadowTex = canvasTex(192, 192, function (g, w, h) {
var grad = g.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
grad.addColorStop(0, 'rgba(0,0,0,0.62)');
grad.addColorStop(0.55, 'rgba(0,0,0,0.30)');
grad.addColorStop(1, 'rgba(0,0,0,0)');
g.fillStyle = grad; g.fillRect(0, 0, w, h);
}, { srgb: true });
function std(name, color, metal, rough, extra) {
var o = { color: color, metalness: metal, roughness: rough };
if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
var m = new T.MeshStandardMaterial(o);
m.name = name;
if (m.envMapIntensity !== undefined) m.envMapIntensity = 1.05;
return m;
}
var glassMat;
if (T.MeshPhysicalMaterial) {
glassMat = new T.MeshPhysicalMaterial(flags.refraction ? {
color: 0xcfe7f0, metalness: 0, roughness: 0.02, transmission: 0.9, thickness: 0.01,
ior: 1.5, transparent: true, opacity: 0.14, side: T.DoubleSide, depthWrite: false,
clearcoat: 0, clearcoatRoughness: 0, envMapIntensity: 1.45
} : {
color: 0xcfe7f0, metalness: 0, roughness: 0.02, transmission: 0,
ior: 1.5, transparent: true, opacity: 0.14, side: T.DoubleSide, depthWrite: false,
clearcoat: 0, clearcoatRoughness: 0, envMapIntensity: 1.45
});
glassMat.name = flags.refraction ? 'glassRefraction' : 'glassClear';
} else {
glassMat = new T.MeshStandardMaterial({
color: 0xcfe7f0, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.14,
side: T.DoubleSide, depthWrite: false
});
glassMat.name = 'glassStd';
}
var glassInnerMat = new T.MeshBasicMaterial({
color: 0x9fb4c2, transparent: true, opacity: 0.05, depthWrite: false,
side: T.DoubleSide, toneMapped: false
});
glassInnerMat.name = 'glassInner';
var M = {
alu: std('alu', 0xffffff, 0.9, 0.33, brushTex ? { map: brushTex } : null),
anodized: std('anodized', 0x30363c, 0.82, 0.38),
frame: std('frame', 0x24282d, 0.78, 0.4),
steel: std('steel', 0x9aa2aa, 0.9, 0.3),
steelDark: std('steelDark', 0x525a63, 0.84, 0.42),
zinc: std('zinc', 0x8d959d, 0.82, 0.45),
blackMetal: std('blackMetal', 0x15181c, 0.66, 0.44),
plastic: std('plastic', 0x0e1013, 0.05, 0.68),
plasticGloss: std('plasticGloss', 0x1b1f24, 0.2, 0.3),
rubber: std('rubber', 0x08090a, 0.0, 0.95),
pcbGreen: std('pcbGreen', 0xffffff, 0.12, 0.62, { map: pcbGreen }),
pcbDark: std('pcbDark', 0xffffff, 0.18, 0.55, { map: pcbDark }),
copper: std('copper', 0xb56f3e, 1.0, 0.28),
silver: std('silver', 0xd8dee3, 1.0, 0.18),
gold: std('gold', 0xd2ad55, 1.0, 0.26),
glass: glassMat,
glassInner: glassInnerMat,
accent: new T.MeshStandardMaterial({
color: accentHex, metalness: 0.35, roughness: 0.34,
emissive: accentHex, emissiveIntensity: 0.05
}),
rgb: new T.MeshStandardMaterial({
color: 0x23262b, metalness: 0.3, roughness: 0.38,
emissive: 0x000000, emissiveIntensity: 0
}),
mesh: new T.MeshStandardMaterial({
color: 0x5c646d, metalness: 0.78, roughness: 0.46,
alphaMap: meshAlpha, alphaTest: 0.5, side: T.DoubleSide
}),
dust: new T.MeshStandardMaterial({
color: 0x14171a, metalness: 0.55, roughness: 0.6,
alphaMap: dustAlpha, alphaTest: 0.18, transparent: true, opacity: 0.92, side: T.DoubleSide
}),
blade: new T.MeshStandardMaterial({
color: 0xffffff, map: bladeTex, alphaTest: 0.32,
metalness: 0.32, roughness: 0.5, side: T.DoubleSide
}),
psuLabel: std('psuLabel', 0xffffff, 0.15, 0.56, { map: psuLabelTex }),
label: std('label', 0xd8d2c4, 0.05, 0.72),
brand: new T.MeshBasicMaterial({
map: brandTex, transparent: true, alphaTest: 0.05,
toneMapped: false, side: T.DoubleSide
}),
shadow: new T.MeshBasicMaterial({
map: shadowTex, transparent: true, depthWrite: false,
toneMapped: false, side: T.DoubleSide
}),
floor: std('floor', 0x0b0d10, 0.08, 0.96)
};
M.accent.name = 'accent';
M.rgb.name = 'rgb';
M.blade.name = 'blade';
M.mesh.name = 'mesh';
M.dust.name = 'dust';
M.brand.name = 'brand';
M.shadow.name = 'shadow';
M.label.name = 'label';
M.glass.name = glassMat.name;
M.glassInner.name = 'glassInner';
var matSeq = 0;
function matrix(x, y, z, sx, sy, sz, rx, ry, rz) {
var q = new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0));
return new T.Matrix4().compose(
new T.Vector3(x || 0, y || 0, z || 0),
q,
new T.Vector3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz)
);
}
function mergeGeos(list) {
var total = 0, arr = [], i;
for (i = 0; i < list.length; i++) {
var g = list[i];
if (g.index) { var ng = g.toNonIndexed(); g.dispose(); g = ng; }
arr.push(g);
total += g.attributes.position.count;
}
var pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
var o = 0;
for (i = 0; i < arr.length; i++) {
var gg = arr[i], p = gg.attributes.position, n = gg.attributes.normal, u = gg.attributes.uv;
pos.set(p.array, o * 3);
if (n) nor.set(n.array, o * 3);
if (u) uv.set(u.array, o * 2);
o += p.count;
}
var out = new T.BufferGeometry();
out.setAttribute('position', new T.BufferAttribute(pos, 3));
out.setAttribute('normal', new T.BufferAttribute(nor, 3));
out.setAttribute('uv', new T.BufferAttribute(uv, 2));
out.computeBoundingSphere();
out.computeBoundingBox();
for (i = 0; i < arr.length; i++) { try { arr[i].dispose(); } catch (_) {} }
return out;
}
function Batch(parent) {
this.parent = parent;
this.map = {};
this.order = [];
}
Batch.prototype.addGeo = function (geo, mat, m) {
var key = mat.uuid || (mat.uuid = 'mat' + (++matSeq));
var b = this.map[key];
if (!b) { b = this.map[key] = { mat: mat, list: [] }; this.order.push(b); }
var g = geo.clone();
var wm = new T.Matrix4().multiplyMatrices(WORLD, m);
g.applyMatrix4(wm);
b.list.push(g);
return this;
};
Batch.prototype.add = function (geo, mat, x, y, z, sx, sy, sz, rx, ry, rz) {
return this.addGeo(geo, mat, matrix(x, y, z, sx, sy, sz, rx, ry, rz));
};
Batch.prototype.flush = function (name) {
for (var i = 0; i < this.order.length; i++) {
var b = this.order[i];
if (!b.list.length) continue;
var merged = mergeGeos(b.list);
var mesh = new T.Mesh(merged, b.mat);
mesh.name = (name || 'batch') + '_' + i;
mesh.matrixAutoUpdate = false;
mesh.updateMatrix();
this.parent.add(mesh);
}
this.map = {};
this.order = [];
};
function roundedRectShape(w, h, r) {
var s = new T.Shape();
var x = -w / 2, y = -h / 2;
r = Math.max(0.0005, Math.min(r, Math.min(w, h) / 2 - 0.0005));
s.moveTo(x + r, y);
s.lineTo(x + w - r, y);
s.quadraticCurveTo(x + w, y, x + w, y + r);
s.lineTo(x + w, y + h - r);
s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
s.lineTo(x + r, y + h);
s.quadraticCurveTo(x, y + h, x, y + h - r);
s.lineTo(x, y + r);
s.quadraticCurveTo(x, y, x + r, y);
return s;
}
function roundedBoxGeo(w, h, d, r, bevel) {
var b = bevel == null ? Math.min(r * 0.55, d * 0.32) : bevel;
b = Math.max(0.0005, Math.min(b, Math.min(w, h) * 0.18, d * 0.45));
var shape = roundedRectShape(Math.max(0.002, w - b * 2), Math.max(0.002, h - b * 2), Math.max(0.0005, r - b));
var geo = new T.ExtrudeGeometry(shape, {
depth: Math.max(0.002, d - b * 2), bevelEnabled: true, bevelThickness: b, bevelSize: b,
bevelSegments: 2, curveSegments: 3, steps: 1
});
geo.computeBoundingBox();
var bb = geo.boundingBox;
geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
return geo;
}
function rbox(batch, mat, x, y, z, w, h, d, r, bevel, axis, rx, ry, rz) {
axis = axis || 'z';
var geo;
if (axis === 'y') { geo = roundedBoxGeo(w, d, h, r, bevel); geo.rotateX(-Math.PI / 2); }
else if (axis === 'x') { geo = roundedBoxGeo(d, h, w, r, bevel); geo.rotateY(Math.PI / 2); }
else geo = roundedBoxGeo(w, h, d, r, bevel);
batch.addGeo(geo, mat, matrix(x, y, z, 1, 1, 1, rx || 0, ry || 0, rz || 0));
try { geo.dispose(); } catch (_) {}
return null;
}
function box(batch, mat, x, y, z, w, h, d, rx, ry, rz) {
batch.add(G.box, mat, x, y, z, w, h, d, rx, ry, rz);
}
function cyl(batch, mat, x, y, z, r, h, rx, ry, rz, seg) {
batch.add(seg === 8 ? G.cyl8 : G.cyl, mat, x, y, z, r, h, r, rx, ry, rz);
}
function plane(batch, mat, x, y, z, w, h, rx, ry, rz) {
batch.add(G.plane, mat, x, y, z, w, h, 1, rx, ry, rz);
}
function torus(batch, mat, x, y, z, r, tube, rx, ry, rz) {
batch.add(G.torus, mat, x, y, z, r, r, r * (tube || 0.06), rx, ry, rz);
}
var hemi = new T.HemisphereLight(0xdfeaff, 0x160f0a, 0.28);
scene.add(hemi);
var keyLight = new T.DirectionalLight(0xfff2df, 2.2);
keyLight.position.set(4.2, 5.2, 4.0);
scene.add(keyLight);
var fillLight = new T.DirectionalLight(0x88b4ff, 0.62);
fillLight.position.set(-4.5, 1.6, -3.2);
scene.add(fillLight);
var warmLight = new T.PointLight(0xffa35c, 2.4, 6.5, 2.0);
warmLight.position.set(0.9, 0.45, 0.55);
scene.add(warmLight);
var rgbLight = new T.PointLight(0x2be0ff, 0, 3.2, 2.0);
rgbLight.position.set(0.1, 0.2, 0.1);
scene.add(rgbLight);
var stage = new T.Group(); stage.name = 'stage'; scene.add(stage);
var floorGeo = new T.CircleGeometry(2.55, 64);
var floorMesh = new T.Mesh(floorGeo, M.floor);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -1.06;
floorMesh.matrixAutoUpdate = false; floorMesh.updateMatrix();
stage.add(floorMesh);
var shadowGeo = new T.PlaneGeometry(2.3, 1.65);
var shadowMesh = new T.Mesh(shadowGeo, M.shadow);
shadowMesh.rotation.x = -Math.PI / 2;
shadowMesh.position.set(-0.05, -1.052, 0.02);
shadowMesh.matrixAutoUpdate = false; shadowMesh.updateMatrix();
stage.add(shadowMesh);
var ringGeo = new T.TorusGeometry(1.48, 0.0045, 4, 72);
var ringMesh = new T.Mesh(ringGeo, M.steelDark);
ringMesh.rotation.x = Math.PI / 2;
ringMesh.position.y = -1.048;
ringMesh.matrixAutoUpdate = false; ringMesh.updateMatrix();
stage.add(ringMesh);
var root = new T.Group(); root.name = 'caseRoot'; scene.add(root);
var chassis = new T.Group(); chassis.name = 'chassis'; root.add(chassis);
var inner = new T.Group(); inner.name = 'inner'; root.add(inner);
var DEPTH_SCALE = 2.05;
var CHASSIS_W = 0.6642857;
chassis.scale.set(CHASSIS_W, 1, DEPTH_SCALE);
var details = new T.Group(); details.name = 'details'; root.add(details);
details.scale.set(CHASSIS_W, 1, DEPTH_SCALE);
inner.position.z = 0.30;
chassis.userData.pcieSlots = 7;
chassis.userData.frontPanel = '-Z';
chassis.userData.glass = '-X';
chassis.userData.rearPanel = '+Z';
var CB = new Batch(chassis);
var FDB = new Batch(details);
var BB = new Batch(inner);
rbox(CB, M.anodized, 0, 0.978, 0, 1.4, 0.048, 1.02, 0.022, 0.007, 'y');
rbox(CB, M.anodized, 0, -0.978, 0, 1.4, 0.048, 1.02, 0.022, 0.007, 'y');
rbox(CB, M.anodized, -0.697, 0, 0, 0.028, 1.94, 1.02, 0.014, 0.006, 'x');
var rearShape = roundedRectShape(1.4, 1.9, 0.014);
var rearHole = new T.Path();
rearHole.absarc(-0.15, 0.55, 0.28, 0, Math.PI * 2, true);
rearShape.holes.push(rearHole);
var rearGeo = new T.ExtrudeGeometry(rearShape, {
depth: 0.02, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004,
bevelSegments: 1, curveSegments: 4, steps: 1
});
rearGeo.computeBoundingBox();
var rbb = rearGeo.boundingBox;
rearGeo.translate(-(rbb.min.x + rbb.max.x) / 2, -(rbb.min.y + rbb.max.y) / 2, -(rbb.min.z + rbb.max.z) / 2);
CB.addGeo(rearGeo, M.frame, matrix(0, 0, -0.458, 1, 1, 1, 0, 0, 0));
try { rearGeo.dispose(); } catch (_) {}
rbox(CB, M.alu, 0, 0.9, 0.455, 1.4, 0.2, 0.078, 0.022, 0.007, 'z');
rbox(CB, M.alu, 0, -0.9, 0.455, 1.4, 0.2, 0.078, 0.022, 0.007, 'z');
rbox(CB, M.alu, -0.62, 0, 0.455, 0.16, 1.62, 0.078, 0.016, 0.006, 'z');
rbox(CB, M.alu, 0.62, 0, 0.455, 0.16, 1.62, 0.078, 0.016, 0.006, 'z');
plane(CB, M.mesh, 0, 0, 0.4955, 1.06, 1.6);
box(CB, M.frame, 0, 0.62, 0.43, 1.1, 0.022, 0.018);
box(CB, M.frame, 0, -0.62, 0.43, 1.1, 0.022, 0.018);
box(CB, M.accent, -0.575, 0, 0.4985, 0.012, 1.48, 0.008);
box(CB, M.accent, 0.575, 0, 0.4985, 0.012, 1.48, 0.008);
plane(CB, M.brand, -0.03, -0.91, 0.4975, 0.36, 0.085);
for (var fx = 0; fx < 2; fx++) for (var fz = 0; fz < 2; fz++) {
var fxp = fx ? 0.5 : -0.5, fzp = fz ? 0.32 : -0.32;
cyl(CB, M.steel, fxp, -1.025, fzp, 0.052, 0.05);
cyl(CB, M.rubber, fxp, -1.052, fzp, 0.06, 0.016);
}
for (var lv = 0; lv < 7; lv++) {
box(CB, M.blackMetal, -0.712, 0.1 + lv * 0.075, 0.25, 0.006, 0.038, 0.26);
}
box(CB, M.steelDark, -0.712, 0.42, 0.25, 0.007, 0.012, 0.3);
var glassShape = roundedRectShape(0.9, 1.88, 0.04);
var glassGeo = new T.ShapeGeometry(glassShape);
var glassMesh = new T.Mesh(glassGeo, M.glass);
glassMesh.position.set(-0.705, 0, 0);
glassMesh.rotation.y = -Math.PI / 2;
glassMesh.name = 'glass';
glassMesh.matrixAutoUpdate = false; glassMesh.updateMatrix();
chassis.add(glassMesh);
var glassInner = new T.Mesh(glassGeo, M.glassInner);
glassInner.position.set(-0.697, 0, 0);
glassInner.rotation.y = -Math.PI / 2;
glassInner.name = 'glassInner';
glassInner.matrixAutoUpdate = false; glassInner.updateMatrix();
chassis.add(glassInner);
box(CB, M.blackMetal, 0.712, 0.925, 0, 0.012, 0.03, 0.88);
box(CB, M.blackMetal, 0.712, -0.925, 0, 0.012, 0.03, 0.88);
box(CB, M.blackMetal, 0.712, 0, 0.445, 0.012, 1.86, 0.03);
box(CB, M.blackMetal, 0.712, 0, -0.445, 0.012, 1.86, 0.03);
for (var gs = 0; gs < 4; gs++) {
var gsy = gs < 2 ? 0.9 : -0.9, gsz = (gs % 2) ? 0.415 : -0.415;
cyl(CB, M.steel, 0.718, gsy, gsz, 0.014, 0.008, 0, 0, Math.PI / 2, 8);
}
rbox(CB, M.anodized, 0.693, 0.962, 0, 0.04, 0.035, 0.9, 0.012, 0.005, 'y');
rbox(CB, M.anodized, 0.693, -0.962, 0, 0.04, 0.035, 0.9, 0.012, 0.005, 'y');
rbox(CB, M.anodized, 0.693, 0, 0.447, 0.04, 1.9, 0.038, 0.012, 0.005, 'x');
rbox(CB, M.anodized, 0.693, 0, -0.447, 0.04, 1.9, 0.038, 0.012, 0.005, 'x');
for (var tv = 0; tv < 6; tv++) {
box(CB, M.blackMetal, 0, 1.007, -0.29 + tv * 0.055, 0.82, 0.005, 0.014);
}
rbox(CB, M.plasticGloss, 0.08, 1.005, 0.305, 0.64, 0.014, 0.16, 0.01, 0.004, 'y');
cyl(CB, M.steel, -0.54, 1.012, 0.305, 0.047, 0.014);
torus(CB, M.accent, -0.54, 1.021, 0.305, 0.052, 0.08, -Math.PI / 2, 0, 0);
cyl(CB, M.plasticGloss, -0.54, 1.021, 0.305, 0.032, 0.008);
box(CB, M.accent, -0.54, 1.026, 0.305, 0.02, 0.003, 0.006);
for (var ui = 0; ui < 2; ui++) {
var ux = 0.055 + ui * 0.085;
box(CB, M.blackMetal, ux, 1.014, 0.305, 0.062, 0.006, 0.03);
box(CB, M.steel, ux, 1.017, 0.305, 0.043, 0.002, 0.012);
}
box(CB, M.blackMetal, 0.255, 1.014, 0.305, 0.036, 0.006, 0.014);
cyl(CB, M.blackMetal, -0.34, 1.014, 0.305, 0.013, 0.006);
cyl(CB, M.accent, -0.305, 1.014, 0.305, 0.008, 0.006);
cyl(CB, M.steel, 0.36, 1.014, 0.305, 0.006, 0.006);
rbox(CB, M.steelDark, -0.34, 0.82, -0.472, 0.34, 0.18, 0.012, 0.008, 0.003, 'z');
for (var rio = 0; rio < 4; rio++) {
box(CB, M.blackMetal, -0.46 + rio * 0.075, 0.85, -0.479, 0.05, 0.045, 0.008);
box(CB, M.steel, -0.46 + rio * 0.075, 0.85, -0.484, 0.035, 0.012, 0.003);
}
for (var pc = 0; pc < 7; pc++) {
box(CB, M.zinc, -0.17, 0.26 - pc * 0.06, -0.474, 0.31, 0.014, 0.01);
cyl(CB, M.steel, -0.03, 0.26 - pc * 0.06, -0.48, 0.006, 0.006, 0, 0, Math.PI / 2, 8);
}
box(CB, M.blackMetal, 0.25, -0.8, -0.476, 0.16, 0.12, 0.01);
box(CB, M.steel, 0.21, -0.8, -0.483, 0.05, 0.05, 0.006);
box(CB, M.blackMetal, 0.3, -0.8, -0.483, 0.05, 0.02, 0.006);
cyl(CB, M.blackMetal, -0.34, 0.55, -0.414, 0.18, 0.012, Math.PI / 2, 0, 0);
for (var rg = 0; rg < 3; rg++) {
torus(CB, M.steelDark, -0.34, 0.55, -0.497, 0.15 - rg * 0.04, 0.035, 0, 0, 0);
}
for (var sp = 0; sp < 3; sp++) {
box(CB, M.steelDark, -0.34, 0.55, -0.499, 0.3, 0.007, 0.006, 0, 0, sp * Math.PI / 3);
}
rbox(BB, M.frame, 0, -0.6, -0.14, 0.70, 0.035, 0.62, 0.02, 0.006, 'y');
box(BB, M.frame, 0, -0.77, 0.165, 0.70, 0.34, 0.025);
box(BB, M.accent, 0, -0.6, 0.172, 1.14, 0.01, 0.008);
torus(BB, M.rubber, 0.02, -0.592, 0.0, 0.05, 0.14, Math.PI / 2, 0, 0);
torus(BB, M.rubber, 0.22, -0.592, 0.0, 0.04, 0.14, Math.PI / 2, 0, 0);
box(BB, M.steelDark, -0.35, -0.598, 0.02, 0.18, 0.006, 0.13);
box(BB, M.steelDark, -0.09, -0.598, 0.02, 0.18, 0.006, 0.13);
box(BB, M.steelDark, -0.30, -0.8, 0.05, 0.02, 0.32, 0.42);
box(BB, M.steelDark, -0.30, -0.8, 0.4, 0.02, 0.32, 0.42);
box(BB, M.steelDark, -0.30, -0.65, 0.225, 0.26, 0.02, 0.4);
box(BB, M.steelDark, -0.30, -0.96, 0.225, 0.26, 0.02, 0.4);
for (var dh = 0; dh < 3; dh++) {
box(BB, M.zinc, -0.30, -0.69 + dh * 0.08, 0.225, 0.22, 0.012, 0.34);
torus(BB, M.rubber, -0.30, -0.69 + dh * 0.08, 0.06, 0.02, 0.14, 0, 0, Math.PI / 2);
}
torus(BB, M.rubber, -0.31, 0.2, 0.44, 0.045, 0.14, 0, Math.PI / 2, 0);
torus(BB, M.rubber, -0.31, -0.05, 0.44, 0.045, 0.14, 0, Math.PI / 2, 0);
box(BB, M.plastic, 0.35, -0.58, 0.18, 0.08, 0.02, 0.1);
BB.flush('bottom');
function fanStatics(r, grill) {
var g = new T.Group();
function add(geo, mat, x, y, z, rx, ry, rz) {
var m = new T.Mesh(geo, mat);
m.position.set(x || 0, y || 0, z || 0);
if (rx) m.rotation.x = rx;
if (ry) m.rotation.y = ry;
if (rz) m.rotation.z = rz;
g.add(m);
}
add(new T.TorusGeometry(r, Math.max(0.009, r * 0.05), 4, 20), M.plastic, 0, 0, 0);
add(new T.TorusGeometry(r * 0.93, 0.008, 4, 18), M.rgb, 0, 0, 0.012);
add(new T.CircleGeometry(r * 0.88, 28), M.plastic, 0, 0, -0.018);
add(new T.CylinderGeometry(r * 0.23, r * 0.23, 0.05, 14), M.plasticGloss, 0, 0, 0.002, Math.PI / 2, 0, 0);
for (var i = 0; i < 3; i++) {
add(new T.BoxGeometry(r * 1.76, r * 0.035, 0.012), M.plastic, 0, 0, -0.012, 0, 0, i * Math.PI / 3);
}
for (var s = 0; s < 4; s++) {
add(new T.CylinderGeometry(0.011, 0.011, 0.008, 6), M.steel,
(s % 2 ? 1 : -1) * r * 0.79, (s < 2 ? 1 : -1) * r * 0.79, 0.02, Math.PI / 2, 0, 0);
}
if (grill) {
add(new T.TorusGeometry(r * 0.82, 0.006, 3, 16), M.steelDark, 0, 0, 0.04);
add(new T.TorusGeometry(r * 0.56, 0.006, 3, 14), M.steelDark, 0, 0, 0.04);
add(new T.TorusGeometry(r * 0.3, 0.006, 3, 10), M.steelDark, 0, 0, 0.04);
}
return g;
}
function bakeGroup(parentBatch, group, base) {
group.updateMatrixWorld(true);
group.traverse(function (o) {
if (!o.isMesh) return;
var m = new T.Matrix4().multiplyMatrices(base, o.matrixWorld);
parentBatch.addGeo(o.geometry, o.material, m);
});
group.traverse(function (o) { if (o.isMesh) { try { o.geometry.dispose(); } catch (_) {} } });
}
function addFan(parentGroup, batch, x, y, z, r, rx, ry, rz, speed, grill, sx) {
sx = sx || 1;
var base = matrix(x, y, z, sx, 1, 1, rx, ry, rz);
var statics = fanStatics(r, grill);
bakeGroup(batch, statics, base);
var fg = new T.Group();
fg.name = 'fanRotor';
fg.userData.radius = r * ((parentGroup === chassis || parentGroup === details) ? CHASSIS_W : 1);
fg.position.set(-x, y, -z);
var qLocal = new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0));
fg.quaternion.copy(WORLD_Q).multiply(qLocal);
var blades = new T.Mesh(G.circle, M.blade);
blades.name = 'blades';
blades.scale.set(r * 1.02 * sx, r * 1.02, 1);
blades.position.z = 0.006;
fg.add(blades);
parentGroup.add(fg);
fg.updateMatrix();
fg.matrixAutoUpdate = false;
fans.push({ b: blades, s: speed });
return fg;
}
addFan(details, FDB, 0, 0.265, 0.35, 0.399, 0, 0, 0, 34, false, 1);
addFan(details, FDB, 0, -0.265, 0.35, 0.399, 0, 0, 0, 31, false, 1);
addFan(details, FDB, -0.15, 0.55, -0.425, 0.399, 0, Math.PI, 0, 27, true, 1);
rbox(CB, M.anodized, 0, 0.88, 0.462, 1.12, 0.065, 0.03, 0.012, 0.004, 'z');
var DF = new Batch(details); plane(DF, M.dust, 0, 0, 0.42, 0.84, 1.56); DF.flush('dustFront');
var DT = new Batch(details); plane(DT, M.dust, 0, 0.91, 0.0, 0.70, 0.80, -Math.PI / 2, 0, 0); DT.flush('dustTop');
var DB = new Batch(details); plane(DB, M.dust, 0, -0.958, -0.20, 0.56, 0.30, -Math.PI / 2, 0, 0); DB.flush('dustBottom');
var FM = new Batch(details); plane(FM, M.mesh, 0, 0, 0.30, 1.08, 1.22, 0, Math.PI, 0); FM.flush('fanMesh');
CB.flush('chassis');
FDB.flush('details');
var mb = new T.Group(); mb.name = 'mb'; inner.add(mb);
var MB = new Batch(mb);
box(MB, M.pcbDark, -0.322, 0.25, -0.02, 0.024, 1.16, 0.98);
plane(MB, M.pcbGreen, -0.308, 0.25, -0.02, 0.96, 1.14, 0, Math.PI / 2, 0);
rbox(MB, M.blackMetal, -0.286, 0.69, -0.37, 0.08, 0.25, 0.3, 0.014, 0.005, 'x');
for (var ai = 0; ai < 5; ai++) box(MB, M.steelDark, -0.24, 0.69, -0.44 + ai * 0.035, 0.018, 0.22, 0.008);
box(MB, M.accent, -0.242, 0.705, -0.34, 0.008, 0.014, 0.2);
rbox(MB, M.blackMetal, -0.286, 0.6, -0.13, 0.06, 0.13, 0.17, 0.012, 0.004, 'x');
for (var vf = 0; vf < 4; vf++) box(MB, M.steelDark, -0.253, 0.6, -0.2 + vf * 0.04, 0.012, 0.11, 0.008);
rbox(MB, M.blackMetal, -0.278, -0.18, 0.0, 0.055, 0.2, 0.24, 0.014, 0.005, 'x');
box(MB, M.accent, -0.246, -0.18, 0.0, 0.006, 0.012, 0.16, 0.5, 0, 0);
box(MB, M.blackMetal, -0.29, 0.42, -0.28, 0.022, 0.21, 0.21);
box(MB, M.steelDark, -0.279, 0.42, -0.28, 0.012, 0.17, 0.17);
for (var ms = 0; ms < 4; ms++) {
box(MB, M.plastic, -0.292, 0.45, -0.16 + ms * 0.072, 0.03, 0.44, 0.02);
box(MB, M.steelDark, -0.276, 0.45, -0.16 + ms * 0.072, 0.008, 0.4, 0.014);
}
for (var psl = 0; psl < 2; psl++) {
box(MB, M.plastic, -0.29, 0.07 - psl * 0.16, -0.1, 0.026, 0.026, 0.52);
box(MB, M.steel, -0.276, 0.07 - psl * 0.16, -0.1, 0.007, 0.014, 0.48);
}
box(MB, M.plastic, -0.275, 0.24, 0.39, 0.06, 0.16, 0.04);
box(MB, M.steel, -0.243, 0.24, 0.39, 0.008, 0.13, 0.026);
box(MB, M.plastic, -0.275, 0.76, -0.36, 0.05, 0.07, 0.045);
box(MB, M.steel, -0.248, 0.76, -0.36, 0.008, 0.05, 0.03);
for (var fi2 = 0; fi2 < 4; fi2++) {
box(MB, M.plastic, -0.28, 0.74 - fi2 * 0.05, -0.02, 0.04, 0.03, 0.015);
}
for (var ci = 0; ci < 10; ci++) {
var cx = -0.272, cy = 0.58 + (ci % 2) * 0.055, cz = -0.24 + Math.floor(ci / 2) * 0.052;
cyl(MB, ci % 3 ? M.silver : M.gold, cx, cy, cz, 0.011, 0.026, 0, 0, Math.PI / 2, 8);
}
for (var li = 0; li < 5; li++) {
box(MB, M.steelDark, -0.272, 0.36, -0.46 + li * 0.05, 0.04, 0.05, 0.038);
}
for (var ms2 = 0; ms2 < 4; ms2++) {
box(MB, M.plastic, -0.29, -0.08 - ms2 * 0.07, -0.18, 0.024, 0.028, 0.3);
box(MB, M.steel, -0.276, -0.08 - ms2 * 0.07, -0.18, 0.006, 0.018, 0.27);
}
for (var sc = 0; sc < 9; sc++) {
var scx = -0.302, scy = -0.28 + (sc % 3) * 0.52, scz = -0.42 + Math.floor(sc / 3) * 0.42;
cyl(MB, M.gold, scx, scy, scz, 0.012, 0.008, 0, 0, Math.PI / 2, 8);
}
box(MB, M.steel, -0.276, -0.32, 0.15, 0.008, 0.02, 0.34);
MB.flush('mb');
mb.scale.y = 1.08;
function addMbPart(name, build) {
var g = new T.Group(); g.name = name; mb.add(g);
var b = new Batch(g); build(b); b.flush(name);
return g;
}
addMbPart('vrm', function (b) {
rbox(b, M.steelDark, -0.335, 0.60, -0.40, 0.035, 0.28, 0.10, 0.008, 0.003, 'x');
for (var i = 0; i < 7; i++) box(b, M.blackMetal, -0.314, 0.49 + i * 0.038, -0.46, 0.018, 0.026, 0.13);
rbox(b, M.steelDark, -0.335, 0.79, -0.24, 0.035, 0.12, 0.30, 0.008, 0.003, 'x');
for (var j = 0; j < 8; j++) box(b, M.blackMetal, -0.314, 0.70, -0.36 + j * 0.035, 0.018, 0.10, 0.02);
});
addMbPart('chipset', function (b) {
rbox(b, M.steelDark, -0.337, -0.20, 0.18, 0.035, 0.24, 0.30, 0.012, 0.004, 'x');
box(b, M.blackMetal, -0.318, -0.20, 0.18, 0.006, 0.10, 0.16);
box(b, M.accent, -0.314, -0.16, 0.18, 0.004, 0.012, 0.12);
});
addMbPart('m2Heatsink', function (b) {
rbox(b, M.silver, -0.335, -0.08, -0.18, 0.025, 0.075, 0.34, 0.006, 0.002, 'x');
box(b, M.blackMetal, -0.32, -0.08, -0.18, 0.006, 0.05, 0.26);
});
addMbPart('ioArmor', function (b) {
var arm = roundedBoxGeo(0.30, 0.24, 0.055, 0.012, 0.004);
arm.rotateY(Math.PI / 2);
b.addGeo(arm, M.blackMetal, matrix(-0.30, 0.72, -0.37, 1, 1, 1, 0, 0.18, 0));
try { arm.dispose(); } catch (_) {}
box(b, M.accent, -0.268, 0.72, -0.43, 0.008, 0.12, 0.02);
});
var cpu = new T.Group(); cpu.name = 'cpu'; inner.add(cpu);
var CPB = new Batch(cpu);
rbox(CPB, M.silver, -0.255, 0.42, -0.28, 0.03, 0.155, 0.155, 0.012, 0.004, 'x');
box(CPB, M.gold, -0.238, 0.42, -0.28, 0.006, 0.13, 0.13);
box(CPB, M.accent, -0.234, 0.48, -0.35, 0.004, 0.01, 0.012);
CPB.flush('cpu');
cpu.visible = false;
for (var ri = 0; ri < 4; ri++) {
var ram = new T.Group(); ram.name = 'ram' + ri; inner.add(ram);
var RB = new Batch(ram);
var rz = -0.16 + ri * 0.072;
box(RB, M.pcbDark, -0.266, 0.45, rz, 0.09, 0.42, 0.034);
rbox(RB, M.silver, -0.218, 0.45, rz, 0.014, 0.4, 0.038, 0.006, 0.003, 'x');
rbox(RB, M.steelDark, -0.212, 0.45, rz, 0.01, 0.39, 0.034, 0.004, 0.002, 'x');
box(RB, M.rgb, -0.207, 0.615, rz, 0.012, 0.018, 0.036);
box(RB, M.accent, -0.207, 0.64, rz, 0.006, 0.004, 0.03);
RB.flush('ram' + ri);
ram.scale.set(1.27, 1.405, 1.0);
ram.position.set(-0.10, -0.08, -0.15);
ram.visible = false;
rams.push(ram);
}
var tower = new T.Group(); tower.name = 'coolerTower'; inner.add(tower);
var TB = new Batch(tower);
box(TB, M.copper, -0.255, 0.43, -0.28, 0.06, 0.16, 0.16);
box(TB, M.steel, -0.22, 0.43, -0.28, 0.03, 0.17, 0.17);
for (var hp = 0; hp < 4; hp++) {
cyl(TB, M.copper, -0.23, 0.66, -0.34 + (hp % 2) * 0.11, 0.011, 0.44, 0, 0, 0, 8);
}
for (var tf = 0; tf < 30; tf++) {
box(TB, M.silver, -0.16, 0.5 + tf * 0.0135, -0.28, 0.29, 0.006, 0.23);
}
box(TB, M.blackMetal, -0.16, 0.905, -0.28, 0.31, 0.018, 0.25);
box(TB, M.accent, -0.16, 0.918, -0.28, 0.24, 0.006, 0.02);
box(TB, M.steelDark, -0.31, 0.66, -0.28, 0.012, 0.4, 0.24);
addFan(tower, TB, -0.16, 0.66, -0.13, 0.265, 0, 0, 0, 30, false);
TB.flush('coolerTower');
tower.position.y = -0.02;
tower.visible = false;
var aio = new T.Group(); aio.name = 'coolerAio'; inner.add(aio);
var AB = new Batch(aio);
cyl(AB, M.blackMetal, 0, 0.42, -0.28, 0.1, 0.07, 0, 0, Math.PI / 2);
torus(AB, M.rgb, 0.033, 0.42, -0.28, 0.09, 0.09, 0, Math.PI / 2, 0);
cyl(AB, M.steel, 0.037, 0.42, -0.28, 0.052, 0.012, 0, 0, Math.PI / 2);
cyl(AB, M.accent, 0.04, 0.42, -0.28, 0.02, 0.008, 0, 0, Math.PI / 2);
var radiator = new T.Group(); radiator.name = 'radiator'; radiator.position.set(0, -0.06, -0.30); aio.add(radiator);
var RB2 = new Batch(radiator);
box(RB2, M.steelDark, 0, 0.89, 0, 0.53, 0.10, 1.76);
for (var rf2 = 0; rf2 < 30; rf2++) {
box(RB2, M.silver, 0, 0.89, -0.86 + rf2 * 0.059, 0.50, 0.08, 0.01);
}
rbox(RB2, M.blackMetal, 0, 0.948, 0, 0.55, 0.012, 1.78, 0.006, 0.002, 'y');
box(RB2, M.accent, 0.267, 0.89, 0, 0.006, 0.008, 1.6);
RB2.flush('radiator');
radiator.scale.set(0.6842, 0.385, 0.9670);
function cableGeo(points, radius, tubular) {
var vec = [];
for (var i = 0; i < points.length; i++) vec.push(new T.Vector3(points[i][0], points[i][1], points[i][2]));
var curve = new T.CatmullRomCurve3(vec);
return new T.TubeGeometry(curve, tubular || 18, radius, 5, false);
}
function addCable(batch, mat, points, radius, tubular) {
var g = cableGeo(points, radius, tubular);
batch.addGeo(g, mat, new T.Matrix4());
try { g.dispose(); } catch (_) {}
}
addCable(AB, M.rubber, [[0.01, 0.46, -0.32], [-0.20, 0.65, -0.24], [-0.18, 0.84, -0.1], [-0.02, 0.88, -0.3]], 0.018, 16);
addCable(AB, M.rubber, [[0.08, 0.46, -0.32], [0.22, 0.66, -0.22], [0.18, 0.84, -0.05], [0.03, 0.88, -0.3]], 0.018, 16);
addFan(aio, AB, 0, 0.74, 0.89, 0.265, Math.PI / 2, 0, 0, 34, false);
addFan(aio, AB, 0, 0.74, 0.30, 0.265, Math.PI / 2, 0, 0, 34, false);
AB.flush('coolerAio');
var aioFan3 = new T.Group(); aioFan3.name = 'aioFan3'; aio.add(aioFan3);
var A3 = new Batch(aioFan3);
addFan(aioFan3, A3, 0, 0.74, -0.29, 0.265, Math.PI / 2, 0, 0, 34, false);
A3.flush('aioFan3');
aioFan3.visible = false;
aio.visible = false;
function makeGpu(name, y, support) {
var g = new T.Group(); g.name = name; inner.add(g);
var GB = new Batch(g);
var cx = -0.16, cz = 0.09;
rbox(GB, M.pcbDark, cx, y, cz, 0.22, 0.58, 1.33, 0.022, 0.006, 'z');
rbox(GB, M.blackMetal, cx, y + 0.02, cz, 0.222, 0.54, 1.30, 0.02, 0.006, 'y');
rbox(GB, M.steelDark, cx, y + 0.285, cz, 0.20, 0.012, 1.28, 0.018, 0.004, 'y');
box(GB, M.rgb, cx + 0.088, y + 0.01, cz, 0.005, 0.01, 1.02);
box(GB, M.accent, cx + 0.09, y - 0.012, cz, 0.004, 0.006, 0.9);
addFan(g, GB, cx, y - 0.255, cz - 0.30, 0.06, Math.PI / 2, 0, 0, 40, false);
addFan(g, GB, cx, y - 0.255, cz + 0.35, 0.06, Math.PI / 2, 0, 0, 40, false);
box(GB, M.gold, cx - 0.08, y - 0.06, cz - 0.42, 0.06, 0.04, 0.16);
box(GB, M.zinc, cx, y, cz - 0.655, 0.22, 0.58, 0.02);
box(GB, M.steel, cx, y - 0.12, cz - 0.668, 0.12, 0.03, 0.008);
cyl(GB, M.steel, cx + 0.08, y + 0.2, cz - 0.67, 0.008, 0.008, 0, 0, Math.PI / 2, 8);
box(GB, M.plastic, cx + 0.03, y + 0.275, cz - 0.32, 0.06, 0.025, 0.07);
box(GB, M.steel, cx + 0.03, y + 0.277, cz - 0.32, 0.04, 0.01, 0.05);
GB.flush(name);
g.scale.set(0.4697, 0.90625, 0.9638);
g.position.set(0.073, y < 0 ? -0.057 : -0.001, 0.009);
g.visible = false;
return g;
}
var gpu1 = makeGpu('gpu1', -0.02, false);
var gpu2 = makeGpu('gpu2', -0.62, false);
var psu = new T.Group(); psu.name = 'psu'; inner.add(psu);
var PB = new Batch(psu);
rbox(PB, M.blackMetal, 0, -0.72, -0.20, 0.67, 0.38, 0.71, 0.012, 0.005, 'z');
box(PB, M.steelDark, 0, -0.535, -0.20, 0.65, 0.012, 0.69);
plane(PB, M.psuLabel, 0.336, -0.72, -0.20, 0.44, 0.2, 0, Math.PI / 2, 0);
box(PB, M.accent, 0.336, -0.83, -0.38, 0.006, 0.008, 0.16);
cyl(PB, M.blackMetal, 0, -0.905, -0.20, 0.085, 0.006);
torus(PB, M.steelDark, 0, -0.905, -0.20, 0.09, 0.005, Math.PI / 2, 0, 0);
torus(PB, M.steelDark, 0, -0.905, -0.20, 0.05, 0.004, Math.PI / 2, 0, 0);
cyl(PB, M.blackMetal, 0, -0.72, -0.555, 0.055, 0.02, Math.PI / 2, 0, 0);
torus(PB, M.steelDark, 0, -0.72, -0.557, 0.06, 0.006, 0, 0, 0);
PB.flush('psu');
psu.scale.set(0.9054, 0.9048, 0.8875);
psu.position.set(0.045, -0.09, 0.03);
psu.visible = false;
var wires = new T.Group(); wires.name = 'wires'; root.add(wires);
function addWire(name, pts) {
var vec = pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); });
var curve = new T.CatmullRomCurve3(vec);
var geo = new T.TubeGeometry(curve, 24, 0.006, 5, false);
var mesh = new T.Mesh(geo, M.rubber);
mesh.name = name; mesh.userData.curve = curve;
wires.add(mesh);
}
addWire('cable24', [[0.385, -0.62, 0.78], [0.385, -0.45, 0.68], [0.385, -0.10, 0.52], [0.385, 0.22, 0.40]]);
addWire('cableEps', [[0.403, -0.62, 0.76], [0.403, -0.40, 0.62], [0.403, -0.02, 0.46], [0.403, 0.70, 0.36]]);
addWire('cablePcie1', [[0.421, -0.64, 0.74], [0.421, -0.38, 0.60], [0.421, -0.05, 0.44], [0.421, 0.10, 0.24]]);
addWire('cablePcie2', [[0.439, -0.64, 0.72], [0.439, -0.38, 0.58], [0.439, -0.05, 0.42], [0.439, -0.50, 0.20]]);
addWire('cableSata', [[0.457, -0.62, 0.70], [0.457, -0.45, 0.56], [0.457, -0.30, 0.40], [0.457, -0.34, 0.28]]);
wires.visible = false;
for (var mi = 0; mi < 4; mi++) {
var dm = new T.Group(); dm.name = 'm2' + mi; inner.add(dm);
var MB2 = new Batch(dm);
var my = -0.08 - mi * 0.07;
box(MB2, M.pcbDark, -0.278, my, -0.18, 0.012, 0.024, 0.3);
rbox(MB2, M.silver, -0.262, my, -0.18, 0.03, 0.05, 0.3, 0.008, 0.003, 'x');
box(MB2, M.accent, -0.245, my, -0.18, 0.006, 0.012, 0.22);
box(MB2, M.gold, -0.278, my, -0.32, 0.012, 0.022, 0.014);
MB2.flush('m2' + mi);
dm.visible = false;
m2s.push(dm);
}
for (var si = 0; si < 3; si++) {
var ds = new T.Group(); ds.name = 'sata' + si; inner.add(ds);
var SB = new Batch(ds);
if (si < 2) {
var sx = -0.35 + si * 0.26, sy = -0.578, sz = 0.02;
rbox(SB, M.silver, sx, sy, sz, 0.16, 0.02, 0.11, 0.008, 0.003, 'y');
box(SB, M.blackMetal, sx, sy + 0.012, sz, 0.14, 0.008, 0.09);
box(SB, M.label, sx - 0.03, sy + 0.017, sz, 0.06, 0.004, 0.04);
box(SB, M.accent, sx + 0.035, sy + 0.017, sz, 0.045, 0.004, 0.012);
box(SB, M.steelDark, sx, sy + 0.008, sz + 0.058, 0.05, 0.008, 0.008);
} else {
rbox(SB, M.zinc, -0.28, -0.81, 0.22, 0.26, 0.06, 0.36, 0.01, 0.004, 'y');
box(SB, M.blackMetal, -0.28, -0.79, 0.29, 0.24, 0.03, 0.2);
box(SB, M.label, -0.28, -0.776, 0.29, 0.12, 0.006, 0.1);
box(SB, M.accent, -0.28, -0.776, 0.38, 0.1, 0.006, 0.012);
box(SB, M.steelDark, -0.28, -0.82, 0.1, 0.22, 0.02, 0.03);
}
SB.flush('sata' + si);
ds.visible = false;
satas.push(ds);
}
root.traverse(function (o) {
if (o.isMesh && o.name !== 'blades') {
if (o.updateMatrix) o.updateMatrix();
o.matrixAutoUpdate = false;
}
});
chassis.updateMatrix(); chassis.matrixAutoUpdate = false;
inner.updateMatrix(); inner.matrixAutoUpdate = false;
stage.traverse(function (o) { if (o.isMesh) { o.updateMatrix(); o.matrixAutoUpdate = false; } });
for (var bg = 0; bg < baseGeos.length; bg++) { try { baseGeos[bg].dispose(); } catch (_) {} }
chassis.visible = false;
details.visible = false;
inner.visible = false;
stage.visible = false;
mb.visible = false;
var layout = {
io: new T.Box3(new T.Vector3(0.17, 0.73, 0.88), new T.Vector3(0.51, 0.91, 0.93)),
fan: new T.Box3(new T.Vector3(0.19, 0.40, 0.78), new T.Vector3(0.49, 0.70, 0.90)),
pcie: new T.Box3(new T.Vector3(0.015, -0.107, 0.894), new T.Vector3(0.325, 0.267, 0.912)),
psu: new T.Box3(new T.Vector3(-0.46, -0.945, 0.14), new T.Vector3(0.06, -0.635, 0.93)),
cavity: new T.Box3(new T.Vector3(-0.445, -0.96, -0.93), new T.Vector3(0.445, 0.96, 0.93)),
outer: new T.Box3(new T.Vector3(-0.465, -1.0, -1.045), new T.Vector3(0.465, 1.0, 1.045))
};
return {
root: root, chassis: chassis, details: details, inner: inner, stage: stage,
mb: mb, cpu: cpu, coolerTower: tower, coolerAio: aio, aioFan3: aioFan3,
rams: rams, m2: m2s, sata: satas, gpu1: gpu1, gpu2: gpu2, psu: psu, glass: glassMesh,
fans: fans, wires: wires, rgbMat: M.rgb, accentMat: M.accent, rgbLight: rgbLight,
keyLight: keyLight, fillLight: fillLight, warmLight: warmLight,
envMap: flags.env, layout: layout
};
}
function sync(build) { return current ? current.sync(build) : false; }
function setPowered(on) { return current ? current.setPowered(on) : false; }
function destroy() {
if (current) { try { current.destroy(); } catch (e) { warn('destroy 失败', e); } }
current = null;
}
function getState() { return current ? current.getState() : null; }
function getStats() { return current ? current.getStats() : null; }
function getLayout() { return current ? current.getLayout() : null; }
if (root.Case3D && root.Case3D !== API && root.Case3D.destroy) { try { root.Case3D.destroy(); } catch (_) {} }
root.Case3D = API;
})(typeof window !== 'undefined' ? window : this);

