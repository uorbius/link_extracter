require = function e(t, n, r) {// XML fetch
    function i(o, a) {
        if (!n[o]) {
            if (!t[o]) {
                var h = "function" == typeof require && require;
                if (!a && h)
                    return h(o, !0);
                if (s)
                    return s(o, !0);
                var u = new Error("Cannot find module '" + o + "'");
                throw u.code = "MODULE_NOT_FOUND",
                u
            }
            var c = n[o] = {
                exports: {}
            };
            t[o][0].call(c.exports, (function(e) {
                return i(t[o][1][e] || e)
            }
            ), c, c.exports, e, t, n, r)
        }
        return n[o].exports
    }
    for (var s = "function" == typeof require && require, o = 0; o < r.length; o++)
        i(r[o]);
    return i
}({
    1: [function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.BandwidthApproximator = void 0;
        const r = 15e3;
        class i {
            constructor(e, t) {
                this.value = e,
                this.timeStamp = t
            }
        }
        n.BandwidthApproximator = class {
            constructor() {
                this.lastBytes = [],
                this.currentBytesSum = 0,
                this.lastBandwidth = [],
                this.addBytes = (e,t)=>{
                    for (this.lastBytes.push(new i(e,t)),
                    this.currentBytesSum += e; t - this.lastBytes[0].timeStamp > r; )
                        this.currentBytesSum -= this.lastBytes.shift().value;
                    const n = Math.min(r, t);
                    this.lastBandwidth.push(new i(this.currentBytesSum / n,t))
                }
                ,
                this.getBandwidth = e=>{
                    for (; 0 !== this.lastBandwidth.length && e - this.lastBandwidth[0].timeStamp > 6e4; )
                        this.lastBandwidth.shift();
                    let t = 0;
                    for (const e of this.lastBandwidth)
                        e.value > t && (t = e.value);
                    return t
                }
                ,
                this.getSmoothInterval = ()=>r,
                this.getMeasureInterval = ()=>6e4
            }
        }
    }
    , {}],
    2: [function(e, t, n) {
        "use strict";
        var r = this && this.__createBinding || (Object.create ? function(e, t, n, r) {
            void 0 === r && (r = n),
            Object.defineProperty(e, r, {
                enumerable: !0,
                get: function() {
                    return t[n]
                }
            })
        }
        : function(e, t, n, r) {
            void 0 === r && (r = n),
            e[r] = t[n]
        }
        )
          , i = this && this.__setModuleDefault || (Object.create ? function(e, t) {
            Object.defineProperty(e, "default", {
                enumerable: !0,
                value: t
            })
        }
        : function(e, t) {
            e.default = t
        }
        )
          , s = this && this.__importStar || function(e) {
            if (e && e.__esModule)
                return e;
            var t = {};
            if (null != e)
                for (var n in e)
                    "default" !== n && Object.prototype.hasOwnProperty.call(e, n) && r(t, e, n);
            return i(t, e),
            t
        }
        ;
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        const o = s(e("./index"));
        window.p2pml || (window.p2pml = {}),
        window.p2pml.core = o
    }
    , {
        "./index": "p2p-media-loader-core"
    }],
    3: [function(e, t, n) {
        "use strict";
        var r = this && this.__importDefault || function(e) {
            return e && e.__esModule ? e : {
                default: e
            }
        }
        ;
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.HttpMediaManager = void 0;
        const i = r(e("debug"))
          , s = e("./stringly-typed-event-emitter");
        class o extends s.STEEmitter {
            constructor(e) {
                super(),
                this.settings = e,
                this.xhrRequests = new Map,
                this.failedSegments = new Map,
                this.debug = i.default("p2pml:http-media-manager"),
                this.download = (e,t)=>{
                    if (this.isDownloading(e))
                        return;
                    this.cleanTimedOutFailedSegments();
                    const n = this.settings.segmentUrlBuilder ? this.settings.segmentUrlBuilder(e) : e.url;
                    this.debug("http segment download", n),
                    e.requestUrl = n;
                    console.log("CHJS: XMLHttpRequest NO1: " + n)
                    const r = new XMLHttpRequest;
                    const nr = new URL(n)
                    if (r.open("GET", n, !0),
                    r.responseType = "arraybuffer",
                    e.range)
                        r.setRequestHeader("Range", e.range),
                        t = void 0;
                    else if (void 0 !== t && this.settings.httpUseRanges) {
                        let e = 0;
                        for (const n of t)
                            e += n.byteLength;
                        r.setRequestHeader("Range", `bytes=${e}-`),
                        this.debug("continue download from", e)
                    } else
                        t = void 0;
                    this.setupXhrEvents(r, e, t),
                    this.settings.xhrSetup && this.settings.xhrSetup(r, n),
                    this.xhrRequests.set(e.id, {
                        xhr: r,
                        segment: e
                    }),
                    r.send()
                }
                ,
                this.abort = e=>{
                    const t = this.xhrRequests.get(e.id);
                    t && (t.xhr.abort(),
                    this.xhrRequests.delete(e.id),
                    this.debug("http segment abort", e.id))
                }
                ,
                this.isDownloading = e=>this.xhrRequests.has(e.id),
                this.isFailed = e=>{
                    const t = this.failedSegments.get(e.id);
                    return void 0 !== t && t > this.now()
                }
                ,
                this.getActiveDownloads = ()=>this.xhrRequests,
                this.getActiveDownloadsCount = ()=>this.xhrRequests.size,
                this.destroy = ()=>{
                    this.xhrRequests.forEach((e=>e.xhr.abort())),
                    this.xhrRequests.clear()
                }
                ,
                this.setupXhrEvents = (e,t,n)=>{
                    let r = 0;
                    e.addEventListener("progress", (e=>{
                        const t = e.loaded - r;
                        this.emit("bytes-downloaded", t),
                        r = e.loaded
                    }
                    )),
                    e.addEventListener("load", (async r=>{
                        if (e.status < 200 || e.status >= 300)
                            return void this.segmentFailure(t, r, e);
                        let i = e.response;
                        if (void 0 !== n && 206 === e.status) {
                            let e = 0;
                            for (const t of n)
                                e += t.byteLength;
                            const t = new Uint8Array(e + i.byteLength);
                            let r = 0;
                            for (const e of n)
                                t.set(new Uint8Array(e), r),
                                r += e.byteLength;
                            t.set(new Uint8Array(i), r),
                            i = t.buffer
                        }
                        await this.segmentDownloadFinished(t, i, e)
                    }
                    )),
                    e.addEventListener("error", (n=>{
                        this.segmentFailure(t, n, e)
                    }
                    )),
                    e.addEventListener("timeout", (n=>{
                        this.segmentFailure(t, n, e)
                    }
                    ))
                }
                ,
                this.segmentDownloadFinished = async(e,t,n)=>{
                    if (e.responseUrl = null === n.responseURL ? void 0 : n.responseURL,
                    this.settings.segmentValidator)
                        try {
                            await this.settings.segmentValidator(Object.assign(Object.assign({}, e), {
                                data: t
                            }), "http")
                        } catch (t) {
                            return this.debug("segment validator failed", t),
                            void this.segmentFailure(e, t, n)
                        }
                    this.xhrRequests.delete(e.id),
                    this.emit("segment-loaded", e, t)
                }
                ,
                this.segmentFailure = (e,t,n)=>{
                    e.responseUrl = null === n.responseURL ? void 0 : n.responseURL,
                    this.xhrRequests.delete(e.id),
                    this.failedSegments.set(e.id, this.now() + this.settings.httpFailedSegmentTimeout),
                    this.emit("segment-error", e, t)
                }
                ,
                this.cleanTimedOutFailedSegments = ()=>{
                    const e = this.now()
                      , t = [];
                    this.failedSegments.forEach(((n,r)=>{
                        n < e && t.push(r)
                    }
                    )),
                    t.forEach((e=>this.failedSegments.delete(e)))
                }
                ,
                this.now = ()=>performance.now()
            }
        }
        n.HttpMediaManager = o
    }
    , {
        "./stringly-typed-event-emitter": 9,
        debug: "debug"
    }],
    4: [function(e, t, n) {
        "use strict";
        var r = this && this.__importDefault || function(e) {
            return e && e.__esModule ? e : {
                default: e
            }
        }
        ;
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.HybridLoader = void 0;
        const i = r(e("debug"))
          , s = e("events")
          , o = r(e("simple-peer"))
          , a = e("./loader-interface")
          , h = e("./http-media-manager")
          , u = e("./p2p-media-manager")
          , c = e("./media-peer")
          , l = e("./bandwidth-approximator")
          , d = e("./segments-memory-storage")
          , f = {
            cachedSegmentExpiration: 3e5,
            cachedSegmentsCount: 30,
            useP2P: !0,
            consumeOnly: !1,
            requiredSegmentsPriority: 1,
            simultaneousHttpDownloads: 2,
            httpDownloadProbability: .1,
            httpDownloadProbabilityInterval: 1e3,
            httpDownloadProbabilitySkipIfNoPeers: !1,
            httpFailedSegmentTimeout: 1e4,
            httpDownloadMaxPriority: 20,
            httpDownloadInitialTimeout: 0,
            httpDownloadInitialTimeoutPerSegment: 4e3,
            httpUseRanges: !1,
            simultaneousP2PDownloads: 3,
            p2pDownloadMaxPriority: 20,
            p2pSegmentDownloadTimeout: 6e4,
            webRtcMaxMessageSize: 65535,
            trackerAnnounce: ["wss://tracker.novage.com.ua", "wss://tracker.openwebtorrent.com"],
            peerRequestsPerAnnounce: 10,
            rtcConfig: o.default.config
        };
        class p extends s.EventEmitter {
            constructor(e={}) {
                super(),
                this.debug = i.default("p2pml:hybrid-loader"),
                this.debugSegments = i.default("p2pml:hybrid-loader-segments"),
                this.segmentsQueue = [],
                this.bandwidthApproximator = new l.BandwidthApproximator,
                this.httpDownloadInitialTimeoutTimestamp = -1 / 0,
                this.createHttpManager = ()=>new h.HttpMediaManager(this.settings),
                this.createP2PManager = ()=>new u.P2PMediaManager(this.segmentsStorage,this.settings),
                this.load = async(e,t)=>{
                    void 0 === this.httpRandomDownloadInterval && (this.httpRandomDownloadInterval = setInterval(this.downloadRandomSegmentOverHttp, this.settings.httpDownloadProbabilityInterval),
                    this.settings.httpDownloadInitialTimeout > 0 && this.settings.httpDownloadInitialTimeoutPerSegment > 0 && (this.debugSegments("enable initial HTTP download timeout", this.settings.httpDownloadInitialTimeout, "per segment", this.settings.httpDownloadInitialTimeoutPerSegment),
                    this.httpDownloadInitialTimeoutTimestamp = this.now(),
                    setTimeout(this.processInitialSegmentTimeout, this.settings.httpDownloadInitialTimeoutPerSegment + 100))),
                    e.length > 0 && (this.masterSwarmId = e[0].masterSwarmId),
                    void 0 !== this.masterSwarmId && this.p2pManager.setStreamSwarmId(t, this.masterSwarmId),
                    this.debug("load segments");
                    let n = !1;
                    for (const t of this.segmentsQueue)
                        e.find((e=>e.url === t.url)) || (this.debug("remove segment", t.url),
                        this.httpManager.isDownloading(t) ? (n = !0,
                        this.httpManager.abort(t)) : this.p2pManager.abort(t),
                        this.emit(a.Events.SegmentAbort, t));
                    if (this.debug.enabled)
                        for (const t of e)
                            this.segmentsQueue.find((e=>e.url === t.url)) || this.debug("add segment", t.url);
                    if (this.segmentsQueue = e,
                    void 0 === this.masterSwarmId)
                        return;
                    let r = await this.segmentsStorage.getSegmentsMap(this.masterSwarmId);
                    n = this.processSegmentsQueue(r) || n,
                    await this.cleanSegmentsStorage() && (r = await this.segmentsStorage.getSegmentsMap(this.masterSwarmId),
                    n = !0),
                    n && !this.settings.consumeOnly && this.p2pManager.sendSegmentsMapToAll(this.createSegmentsMap(r))
                }
                ,
                this.getSegment = async e=>void 0 === this.masterSwarmId ? void 0 : this.segmentsStorage.getSegment(e, this.masterSwarmId),
                this.getSettings = ()=>this.settings,
                this.getDetails = ()=>({
                    peerId: this.p2pManager.getPeerId()
                }),
                this.getBandwidthEstimate = ()=>this.bandwidthApproximator.getBandwidth(this.now()),
                this.destroy = async()=>{
                    void 0 !== this.httpRandomDownloadInterval && (clearInterval(this.httpRandomDownloadInterval),
                    this.httpRandomDownloadInterval = void 0),
                    this.httpDownloadInitialTimeoutTimestamp = -1 / 0,
                    this.segmentsQueue = [],
                    this.httpManager.destroy(),
                    this.p2pManager.destroy(),
                    this.masterSwarmId = void 0,
                    await this.segmentsStorage.destroy()
                }
                ,
                this.processInitialSegmentTimeout = async()=>{
                    if (void 0 !== this.httpRandomDownloadInterval) {
                        if (void 0 !== this.masterSwarmId) {
                            const e = await this.segmentsStorage.getSegmentsMap(this.masterSwarmId);
                            this.processSegmentsQueue(e) && !this.settings.consumeOnly && this.p2pManager.sendSegmentsMapToAll(this.createSegmentsMap(e))
                        }
                        this.httpDownloadInitialTimeoutTimestamp !== -1 / 0 && setTimeout(this.processInitialSegmentTimeout, this.settings.httpDownloadInitialTimeoutPerSegment)
                    }
                }
                ,
                this.processSegmentsQueue = e=>{
                    if (this.debugSegments("process segments queue. priority", this.segmentsQueue.length > 0 ? this.segmentsQueue[0].priority : 0),
                    void 0 === this.masterSwarmId || 0 === this.segmentsQueue.length)
                        return !1;
                    let t, n = !1, r = !0;
                    if (this.httpDownloadInitialTimeoutTimestamp !== -1 / 0) {
                        let t;
                        for (const n of this.segmentsQueue)
                            if (!e.has(n.id)) {
                                t = n.priority;
                                break
                            }
                        const n = this.now() - this.httpDownloadInitialTimeoutTimestamp;
                        r = n >= this.settings.httpDownloadInitialTimeout || void 0 !== t && n > this.settings.httpDownloadInitialTimeoutPerSegment && t <= 0,
                        r && (this.debugSegments("cancel initial HTTP download timeout - timed out"),
                        this.httpDownloadInitialTimeoutTimestamp = -1 / 0)
                    }
                    for (let i = 0; i < this.segmentsQueue.length; i++) {
                        const s = this.segmentsQueue[i];
                        if (!e.has(s.id) && !this.httpManager.isDownloading(s)) {
                            if (s.priority <= this.settings.requiredSegmentsPriority && r && !this.httpManager.isFailed(s)) {
                                if (this.httpManager.getActiveDownloadsCount() >= this.settings.simultaneousHttpDownloads)
                                    for (let e = this.segmentsQueue.length - 1; e > i; e--) {
                                        const t = this.segmentsQueue[e];
                                        if (this.httpManager.isDownloading(t)) {
                                            this.debugSegments("cancel HTTP download", t.priority, t.url),
                                            this.httpManager.abort(t);
                                            break
                                        }
                                    }
                                if (this.httpManager.getActiveDownloadsCount() < this.settings.simultaneousHttpDownloads) {
                                    const e = this.p2pManager.abort(s);
                                    this.httpManager.download(s, e),
                                    this.debugSegments("HTTP download (priority)", s.priority, s.url),
                                    n = !0;
                                    continue
                                }
                            }
                            if (!this.p2pManager.isDownloading(s))
                                if (s.priority <= this.settings.requiredSegmentsPriority) {
                                    if (t = t || this.p2pManager.getOverallSegmentsMap(),
                                    t.get(s.id) !== c.MediaPeerSegmentStatus.Loaded)
                                        continue;
                                    if (this.p2pManager.getActiveDownloadsCount() >= this.settings.simultaneousP2PDownloads)
                                        for (let e = this.segmentsQueue.length - 1; e > i; e--) {
                                            const t = this.segmentsQueue[e];
                                            if (this.p2pManager.isDownloading(t)) {
                                                this.debugSegments("cancel P2P download", t.priority, t.url),
                                                this.p2pManager.abort(t);
                                                break
                                            }
                                        }
                                    if (this.p2pManager.getActiveDownloadsCount() < this.settings.simultaneousP2PDownloads && this.p2pManager.download(s)) {
                                        this.debugSegments("P2P download (priority)", s.priority, s.url);
                                        continue
                                    }
                                } else
                                    this.p2pManager.getActiveDownloadsCount() < this.settings.simultaneousP2PDownloads && s.priority <= this.settings.p2pDownloadMaxPriority && this.p2pManager.download(s) && this.debugSegments("P2P download", s.priority, s.url)
                        }
                    }
                    return n
                }
                ,
                this.downloadRandomSegmentOverHttp = async()=>{
                    if (void 0 === this.masterSwarmId || void 0 === this.httpRandomDownloadInterval || this.httpDownloadInitialTimeoutTimestamp !== -1 / 0 || this.httpManager.getActiveDownloadsCount() >= this.settings.simultaneousHttpDownloads || this.settings.httpDownloadProbabilitySkipIfNoPeers && 0 === this.p2pManager.getPeers().size || this.settings.consumeOnly)
                        return;
                    const e = await this.segmentsStorage.getSegmentsMap(this.masterSwarmId)
                      , t = this.p2pManager.getOverallSegmentsMap()
                      , n = this.segmentsQueue.filter((n=>!this.p2pManager.isDownloading(n) && !this.httpManager.isDownloading(n) && !t.has(n.id) && !this.httpManager.isFailed(n) && n.priority <= this.settings.httpDownloadMaxPriority && !e.has(n.id)));
                    if (0 === n.length)
                        return;
                    if (Math.random() > this.settings.httpDownloadProbability * n.length)
                        return;
                    const r = n[Math.floor(Math.random() * n.length)];
                    this.debugSegments("HTTP download (random)", r.priority, r.url),
                    this.httpManager.download(r),
                    this.p2pManager.sendSegmentsMapToAll(this.createSegmentsMap(e))
                }
                ,
                this.onPieceBytesDownloaded = (e,t,n)=>{
                    this.bandwidthApproximator.addBytes(t, this.now()),
                    this.emit(a.Events.PieceBytesDownloaded, e, t, n)
                }
                ,
                this.onPieceBytesUploaded = (e,t,n)=>{
                    this.emit(a.Events.PieceBytesUploaded, e, t, n)
                }
                ,
                this.onSegmentLoaded = async(e,t,n)=>{
                    if (this.debugSegments("segment loaded", e.id, e.url),
                    void 0 === this.masterSwarmId)
                        return;
                    e.data = t,
                    e.downloadBandwidth = this.bandwidthApproximator.getBandwidth(this.now()),
                    await this.segmentsStorage.storeSegment(e),
                    this.emit(a.Events.SegmentLoaded, e, n);
                    const r = await this.segmentsStorage.getSegmentsMap(this.masterSwarmId);
                    this.processSegmentsQueue(r),
                    this.settings.consumeOnly || this.p2pManager.sendSegmentsMapToAll(this.createSegmentsMap(r))
                }
                ,
                this.onSegmentError = async(e,t,n)=>{
                    if (this.debugSegments("segment error", e.id, e.url, n, t),
                    this.emit(a.Events.SegmentError, e, t, n),
                    void 0 !== this.masterSwarmId) {
                        const e = await this.segmentsStorage.getSegmentsMap(this.masterSwarmId);
                        this.processSegmentsQueue(e) && !this.settings.consumeOnly && this.p2pManager.sendSegmentsMapToAll(this.createSegmentsMap(e))
                    }
                }
                ,
                this.getStreamSwarmId = e=>void 0 === e.streamId ? e.masterSwarmId : `${e.masterSwarmId}+${e.streamId}`,
                this.createSegmentsMap = e=>{
                    const t = {}
                      , n = (e,n)=>{
                        const r = this.getStreamSwarmId(e)
                          , i = e.sequence;
                        let s = t[r];
                        void 0 === s && (s = ["", []],
                        t[r] = s);
                        const o = s[1];
                        s[0] += 0 === o.length ? i : `|${i}`,
                        o.push(n)
                    }
                    ;
                    for (const t of e.values())
                        n(t.segment, c.MediaPeerSegmentStatus.Loaded);
                    for (const e of this.httpManager.getActiveDownloads().values())
                        n(e.segment, c.MediaPeerSegmentStatus.LoadingByHttp);
                    return t
                }
                ,
                this.onPeerConnect = async e=>{
                    this.emit(a.Events.PeerConnect, e),
                    this.settings.consumeOnly || void 0 === this.masterSwarmId || this.p2pManager.sendSegmentsMap(e.id, this.createSegmentsMap(await this.segmentsStorage.getSegmentsMap(this.masterSwarmId)))
                }
                ,
                this.onPeerClose = e=>{
                    this.emit(a.Events.PeerClose, e)
                }
                ,
                this.onTrackerUpdate = async e=>{
                    if (this.httpDownloadInitialTimeoutTimestamp !== -1 / 0 && void 0 !== e.incomplete && e.incomplete <= 1 && (this.debugSegments("cancel initial HTTP download timeout - no peers"),
                    this.httpDownloadInitialTimeoutTimestamp = -1 / 0,
                    void 0 !== this.masterSwarmId)) {
                        const e = await this.segmentsStorage.getSegmentsMap(this.masterSwarmId);
                        this.processSegmentsQueue(e) && !this.settings.consumeOnly && this.p2pManager.sendSegmentsMapToAll(this.createSegmentsMap(e))
                    }
                }
                ,
                this.cleanSegmentsStorage = async()=>void 0 !== this.masterSwarmId && this.segmentsStorage.clean(this.masterSwarmId, (e=>void 0 !== this.segmentsQueue.find((t=>t.id === e)))),
                this.now = ()=>performance.now(),
                this.settings = Object.assign(Object.assign({}, f), e);
                const {bufferedSegmentsCount: t} = e;
                "number" == typeof t && (void 0 === e.p2pDownloadMaxPriority && (this.settings.p2pDownloadMaxPriority = t),
                void 0 === e.httpDownloadMaxPriority && (this.settings.p2pDownloadMaxPriority = t)),
                this.segmentsStorage = void 0 === this.settings.segmentsStorage ? new d.SegmentsMemoryStorage(this.settings) : this.settings.segmentsStorage,
                this.debug("loader settings", this.settings),
                this.httpManager = this.createHttpManager(),
                this.httpManager.on("segment-loaded", this.onSegmentLoaded),
                this.httpManager.on("segment-error", this.onSegmentError),
                this.httpManager.on("bytes-downloaded", (e=>this.onPieceBytesDownloaded("http", e))),
                this.p2pManager = this.createP2PManager(),
                this.p2pManager.on("segment-loaded", this.onSegmentLoaded),
                this.p2pManager.on("segment-error", this.onSegmentError),
                this.p2pManager.on("peer-data-updated", (async()=>{
                    if (void 0 === this.masterSwarmId)
                        return;
                    const e = await this.segmentsStorage.getSegmentsMap(this.masterSwarmId);
                    this.processSegmentsQueue(e) && !this.settings.consumeOnly && this.p2pManager.sendSegmentsMapToAll(this.createSegmentsMap(e))
                }
                )),
                this.p2pManager.on("bytes-downloaded", ((e,t)=>this.onPieceBytesDownloaded("p2p", e, t))),
                this.p2pManager.on("bytes-uploaded", ((e,t)=>this.onPieceBytesUploaded("p2p", e, t))),
                this.p2pManager.on("peer-connected", this.onPeerConnect),
                this.p2pManager.on("peer-closed", this.onPeerClose),
                this.p2pManager.on("tracker-update", this.onTrackerUpdate)
            }
        }
        n.HybridLoader = p,
        p.isSupported = ()=>void 0 !== window.RTCPeerConnection.prototype.createDataChannel
    }
    , {
        "./bandwidth-approximator": 1,
        "./http-media-manager": 3,
        "./loader-interface": 5,
        "./media-peer": 6,
        "./p2p-media-manager": 7,
        "./segments-memory-storage": 8,
        debug: "debug",
        events: "events",
        "simple-peer": 45
    }],
    5: [function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.Events = void 0,
        function(e) {
            e.SegmentLoaded = "segment_loaded",
            e.SegmentError = "segment_error",
            e.SegmentAbort = "segment_abort",
            e.PeerConnect = "peer_connect",
            e.PeerClose = "peer_close",
            e.PieceBytesDownloaded = "piece_bytes_downloaded",
            e.PieceBytesUploaded = "piece_bytes_uploaded"
        }(n.Events || (n.Events = {}))
    }
    , {}],
    6: [function(e, t, n) {
        "use strict";
        var r = this && this.__importDefault || function(e) {
            return e && e.__esModule ? e : {
                default: e
            }
        }
        ;
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.MediaPeer = n.MediaPeerSegmentStatus = void 0;
        const i = r(e("debug"))
          , s = e("buffer")
          , o = e("./stringly-typed-event-emitter");
        var a, h;
        !function(e) {
            e[e.SegmentData = 0] = "SegmentData",
            e[e.SegmentAbsent = 1] = "SegmentAbsent",
            e[e.SegmentsMap = 2] = "SegmentsMap",
            e[e.SegmentRequest = 3] = "SegmentRequest",
            e[e.CancelSegmentRequest = 4] = "CancelSegmentRequest"
        }(a || (a = {})),
        function(e) {
            e[e.Loaded = 0] = "Loaded",
            e[e.LoadingByHttp = 1] = "LoadingByHttp"
        }(h = n.MediaPeerSegmentStatus || (n.MediaPeerSegmentStatus = {}));
        class u {
            constructor(e, t) {
                this.id = e,
                this.size = t,
                this.bytesDownloaded = 0,
                this.pieces = []
            }
        }
        class c extends o.STEEmitter {
            constructor(e, t) {
                super(),
                this.peer = e,
                this.settings = t,
                this.remoteAddress = "",
                this.downloadingSegmentId = null,
                this.downloadingSegment = null,
                this.segmentsMap = new Map,
                this.debug = i.default("p2pml:media-peer"),
                this.timer = null,
                this.onPeerConnect = ()=>{
                    this.debug("peer connect", this.id, this),
                    this.remoteAddress = this.peer.remoteAddress,
                    this.emit("connect", this)
                }
                ,
                this.onPeerClose = ()=>{
                    this.debug("peer close", this.id, this),
                    this.terminateSegmentRequest(),
                    this.emit("close", this)
                }
                ,
                this.onPeerError = e=>{
                    this.debug("peer error", this.id, e, this)
                }
                ,
                this.receiveSegmentPiece = e=>{
                    if (!this.downloadingSegment)
                        return void this.debug("peer segment not requested", this.id, this);
                    this.downloadingSegment.bytesDownloaded += e.byteLength,
                    this.downloadingSegment.pieces.push(e),
                    this.emit("bytes-downloaded", this, e.byteLength);
                    const t = this.downloadingSegment.id;
                    if (this.downloadingSegment.bytesDownloaded === this.downloadingSegment.size) {
                        const e = new Uint8Array(this.downloadingSegment.size);
                        let n = 0;
                        for (const t of this.downloadingSegment.pieces)
                            e.set(new Uint8Array(t), n),
                            n += t.byteLength;
                        this.debug("peer segment download done", this.id, t, this),
                        this.terminateSegmentRequest(),
                        this.emit("segment-loaded", this, t, e.buffer)
                    } else
                        this.downloadingSegment.bytesDownloaded > this.downloadingSegment.size && (this.debug("peer segment download bytes mismatch", this.id, t, this),
                        this.terminateSegmentRequest(),
                        this.emit("segment-error", this, t, "Too many bytes received for segment"))
                }
                ,
                this.getJsonCommand = e=>{
                    const t = new Uint8Array(e);
                    if (123 === t[0] && 34 === t[1] && 125 === t[e.byteLength - 1])
                        try {
                            return JSON.parse((new TextDecoder).decode(e))
                        } catch (e) {
                            return null
                        }
                    return null
                }
                ,
                this.onPeerData = e=>{
                    const t = this.getJsonCommand(e);
                    if (null !== t) {
                        if (this.downloadingSegment) {
                            this.debug("peer segment download is interrupted by a command", this.id, this);
                            const e = this.downloadingSegment.id;
                            return this.terminateSegmentRequest(),
                            void this.emit("segment-error", this, e, "Segment download is interrupted by a command")
                        }
                        switch (this.debug("peer receive command", this.id, t, this),
                        t.c) {
                        case a.SegmentsMap:
                            this.segmentsMap = this.createSegmentsMap(t.m),
                            this.emit("data-updated");
                            break;
                        case a.SegmentRequest:
                            this.emit("segment-request", this, t.i);
                            break;
                        case a.SegmentData:
                            this.downloadingSegmentId && this.downloadingSegmentId === t.i && "number" == typeof t.s && t.s >= 0 && (this.downloadingSegment = new u(t.i,t.s),
                            this.cancelResponseTimeoutTimer());
                            break;
                        case a.SegmentAbsent:
                            this.downloadingSegmentId && this.downloadingSegmentId === t.i && (this.terminateSegmentRequest(),
                            this.segmentsMap.delete(t.i),
                            this.emit("segment-absent", this, t.i));
                            break;
                        case a.CancelSegmentRequest:
                        }
                    } else
                        this.receiveSegmentPiece(e)
                }
                ,
                this.createSegmentsMap = e=>{
                    if (!(e instanceof Object))
                        return new Map;
                    const t = new Map;
                    for (const n of Object.keys(e)) {
                        const r = e[n];
                        if (!(r instanceof Array && 2 === r.length && "string" == typeof r[0] && r[1]instanceof Array))
                            return new Map;
                        const i = r[0].split("|")
                          , s = r[1];
                        if (i.length !== s.length)
                            return new Map;
                        for (let e = 0; e < i.length; e++) {
                            const r = s[e];
                            if ("number" != typeof r || void 0 === h[r])
                                return new Map;
                            t.set(`${n}+${i[e]}`, r)
                        }
                    }
                    return t
                }
                ,
                this.sendCommand = e=>{
                    this.debug("peer send command", this.id, e, this),
                    this.peer.write(JSON.stringify(e))
                }
                ,
                this.destroy = ()=>{
                    this.debug("peer destroy", this.id, this),
                    this.terminateSegmentRequest(),
                    this.peer.destroy()
                }
                ,
                this.getDownloadingSegmentId = ()=>this.downloadingSegmentId,
                this.getSegmentsMap = ()=>this.segmentsMap,
                this.sendSegmentsMap = e=>{
                    this.sendCommand({
                        c: a.SegmentsMap,
                        m: e
                    })
                }
                ,
                this.sendSegmentData = (e,t)=>{
                    this.sendCommand({
                        c: a.SegmentData,
                        i: e,
                        s: t.byteLength
                    });
                    let n = t.byteLength;
                    for (; n > 0; ) {
                        const e = n >= this.settings.webRtcMaxMessageSize ? this.settings.webRtcMaxMessageSize : n
                          , r = s.Buffer.from(t, t.byteLength - n, e);
                        this.peer.write(r),
                        n -= e
                    }
                    this.emit("bytes-uploaded", this, t.byteLength)
                }
                ,
                this.sendSegmentAbsent = e=>{
                    this.sendCommand({
                        c: a.SegmentAbsent,
                        i: e
                    })
                }
                ,
                this.requestSegment = e=>{
                    if (this.downloadingSegmentId)
                        throw new Error("A segment is already downloading: " + this.downloadingSegmentId);
                    this.sendCommand({
                        c: a.SegmentRequest,
                        i: e
                    }),
                    this.downloadingSegmentId = e,
                    this.runResponseTimeoutTimer()
                }
                ,
                this.cancelSegmentRequest = ()=>{
                    let e;
                    if (this.downloadingSegmentId) {
                        const t = this.downloadingSegmentId;
                        e = this.downloadingSegment ? this.downloadingSegment.pieces : void 0,
                        this.terminateSegmentRequest(),
                        this.sendCommand({
                            c: a.CancelSegmentRequest,
                            i: t
                        })
                    }
                    return e
                }
                ,
                this.runResponseTimeoutTimer = ()=>{
                    this.timer = setTimeout((()=>{
                        if (this.timer = null,
                        !this.downloadingSegmentId)
                            return;
                        const e = this.downloadingSegmentId;
                        this.cancelSegmentRequest(),
                        this.emit("segment-timeout", this, e)
                    }
                    ), this.settings.p2pSegmentDownloadTimeout)
                }
                ,
                this.cancelResponseTimeoutTimer = ()=>{
                    this.timer && (clearTimeout(this.timer),
                    this.timer = null)
                }
                ,
                this.terminateSegmentRequest = ()=>{
                    this.downloadingSegmentId = null,
                    this.downloadingSegment = null,
                    this.cancelResponseTimeoutTimer()
                }
                ,
                this.peer.on("connect", this.onPeerConnect),
                this.peer.on("close", this.onPeerClose),
                this.peer.on("error", this.onPeerError),
                this.peer.on("data", this.onPeerData),
                this.id = e.id
            }
        }
        n.MediaPeer = c
    }
    , {
        "./stringly-typed-event-emitter": 9,
        buffer: "buffer",
        debug: "debug"
    }],
    7: [function(e, t, n) {
        "use strict";
        var r = this && this.__importDefault || function(e) {
            return e && e.__esModule ? e : {
                default: e
            }
        }
        ;
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.P2PMediaManager = void 0;
        const i = r(e("debug"))
          , s = r(e("bittorrent-tracker/client"))
          , o = e("buffer")
          , a = r(e("sha.js/sha1"))
          , h = e("./stringly-typed-event-emitter")
          , u = e("./media-peer")
          , c = e("./index")
          , l = `-WW${c.version.replace(/\d*./g, (e=>("0" + parseInt(e, 10) % 100).slice(-2))).slice(0, 4)}-`;
        class d {
            constructor(e, t) {
                this.peerId = e,
                this.segment = t
            }
        }
        class f extends h.STEEmitter {
            constructor(e, t) {
                super(),
                this.segmentsStorage = e,
                this.settings = t,
                this.trackerClient = null,
                this.peers = new Map,
                this.peerCandidates = new Map,
                this.peerSegmentRequests = new Map,
                this.streamSwarmId = null,
                this.debug = i.default("p2pml:p2p-media-manager"),
                this.pendingTrackerClient = null,
                this.getPeers = ()=>this.peers,
                this.getPeerId = ()=>o.Buffer.from(this.peerId).toString("hex"),
                this.setStreamSwarmId = (e,t)=>{
                    if (this.streamSwarmId === e)
                        return;
                    this.destroy(!0),
                    this.streamSwarmId = e,
                    this.masterSwarmId = t,
                    this.debug("stream swarm ID", this.streamSwarmId),
                    this.pendingTrackerClient = {
                        isDestroyed: !1
                    };
                    const n = this.pendingTrackerClient
                      , r = (new a.default).update(`2${this.streamSwarmId}`).digest();
                    n.isDestroyed ? null !== this.trackerClient && (this.trackerClient.destroy(),
                    this.trackerClient = null) : (this.pendingTrackerClient = null,
                    this.createClient(r))
                }
                ,
                this.createClient = e=>{
                    if (!this.settings.useP2P)
                        return;
                    const t = {
                        infoHash: o.Buffer.from(e, 0, 20),
                        peerId: o.Buffer.from(this.peerId, 0, 20),
                        announce: this.settings.trackerAnnounce,
                        rtcConfig: this.settings.rtcConfig,
                        port: 6881,
                        getAnnounceOpts: ()=>({
                            numwant: this.settings.peerRequestsPerAnnounce
                        })
                    };
                    let n = this.trackerClient;
                    this.trackerClient = new s.default(t),
                    this.trackerClient.on("error", this.onTrackerError),
                    this.trackerClient.on("warning", this.onTrackerWarning),
                    this.trackerClient.on("update", this.onTrackerUpdate),
                    this.trackerClient.on("peer", this.onTrackerPeer),
                    this.trackerClient.start(),
                    null !== n && (n.destroy(),
                    n = null)
                }
                ,
                this.onTrackerError = e=>{
                    this.debug("tracker error", e)
                }
                ,
                this.onTrackerWarning = e=>{
                    this.debug("tracker warning", e)
                }
                ,
                this.onTrackerUpdate = e=>{
                    this.debug("tracker update", e),
                    this.emit("tracker-update", e)
                }
                ,
                this.onTrackerPeer = e=>{
                    if (this.debug("tracker peer", e.id, e),
                    this.peers.has(e.id))
                        return this.debug("tracker peer already connected", e.id, e),
                        void e.destroy();
                    const t = new u.MediaPeer(e,this.settings);
                    t.on("connect", this.onPeerConnect),
                    t.on("close", this.onPeerClose),
                    t.on("data-updated", this.onPeerDataUpdated),
                    t.on("segment-request", this.onSegmentRequest),
                    t.on("segment-loaded", this.onSegmentLoaded),
                    t.on("segment-absent", this.onSegmentAbsent),
                    t.on("segment-error", this.onSegmentError),
                    t.on("segment-timeout", this.onSegmentTimeout),
                    t.on("bytes-downloaded", this.onPieceBytesDownloaded),
                    t.on("bytes-uploaded", this.onPieceBytesUploaded);
                    let n = this.peerCandidates.get(t.id);
                    n || (n = [],
                    this.peerCandidates.set(t.id, n)),
                    n.push(t)
                }
                ,
                this.download = e=>{
                    if (this.isDownloading(e))
                        return !1;
                    const t = [];
                    for (const n of this.peers.values())
                        null === n.getDownloadingSegmentId() && n.getSegmentsMap().get(e.id) === u.MediaPeerSegmentStatus.Loaded && t.push(n);
                    if (0 === t.length)
                        return !1;
                    const n = t[Math.floor(Math.random() * t.length)];
                    return n.requestSegment(e.id),
                    this.peerSegmentRequests.set(e.id, new d(n.id,e)),
                    !0
                }
                ,
                this.abort = e=>{
                    let t;
                    const n = this.peerSegmentRequests.get(e.id);
                    if (n) {
                        const r = this.peers.get(n.peerId);
                        r && (t = r.cancelSegmentRequest()),
                        this.peerSegmentRequests.delete(e.id)
                    }
                    return t
                }
                ,
                this.isDownloading = e=>this.peerSegmentRequests.has(e.id),
                this.getActiveDownloadsCount = ()=>this.peerSegmentRequests.size,
                this.destroy = (e=!1)=>{
                    this.streamSwarmId = null,
                    this.trackerClient && (this.trackerClient.stop(),
                    e ? (this.trackerClient.removeAllListeners("error"),
                    this.trackerClient.removeAllListeners("warning"),
                    this.trackerClient.removeAllListeners("update"),
                    this.trackerClient.removeAllListeners("peer")) : (this.trackerClient.destroy(),
                    this.trackerClient = null)),
                    this.pendingTrackerClient && (this.pendingTrackerClient.isDestroyed = !0,
                    this.pendingTrackerClient = null),
                    this.peers.forEach((e=>e.destroy())),
                    this.peers.clear(),
                    this.peerSegmentRequests.clear();
                    for (const e of this.peerCandidates.values())
                        for (const t of e)
                            t.destroy();
                    this.peerCandidates.clear()
                }
                ,
                this.sendSegmentsMapToAll = e=>{
                    this.peers.forEach((t=>t.sendSegmentsMap(e)))
                }
                ,
                this.sendSegmentsMap = (e,t)=>{
                    const n = this.peers.get(e);
                    n && n.sendSegmentsMap(t)
                }
                ,
                this.getOverallSegmentsMap = ()=>{
                    const e = new Map;
                    for (const t of this.peers.values())
                        for (const [n,r] of t.getSegmentsMap())
                            r === u.MediaPeerSegmentStatus.Loaded ? e.set(n, u.MediaPeerSegmentStatus.Loaded) : e.get(n) || e.set(n, u.MediaPeerSegmentStatus.LoadingByHttp);
                    return e
                }
                ,
                this.onPieceBytesDownloaded = (e,t)=>{
                    this.emit("bytes-downloaded", t, e.id)
                }
                ,
                this.onPieceBytesUploaded = (e,t)=>{
                    this.emit("bytes-uploaded", t, e.id)
                }
                ,
                this.onPeerConnect = e=>{
                    if (this.peers.get(e.id))
                        return this.debug("tracker peer already connected (in peer connect)", e.id, e),
                        void e.destroy();
                    this.peers.set(e.id, e);
                    const t = this.peerCandidates.get(e.id);
                    if (t) {
                        for (const n of t)
                            n !== e && n.destroy();
                        this.peerCandidates.delete(e.id)
                    }
                    this.emit("peer-connected", {
                        id: e.id,
                        remoteAddress: e.remoteAddress
                    })
                }
                ,
                this.onPeerClose = e=>{
                    if (this.peers.get(e.id) !== e) {
                        const t = this.peerCandidates.get(e.id);
                        if (!t)
                            return;
                        const n = t.indexOf(e);
                        return -1 !== n && t.splice(n, 1),
                        void (0 === t.length && this.peerCandidates.delete(e.id))
                    }
                    for (const [t,n] of this.peerSegmentRequests)
                        n.peerId === e.id && this.peerSegmentRequests.delete(t);
                    this.peers.delete(e.id),
                    this.emit("peer-data-updated"),
                    this.emit("peer-closed", e.id)
                }
                ,
                this.onPeerDataUpdated = ()=>{
                    this.emit("peer-data-updated")
                }
                ,
                this.onSegmentRequest = async(e,t)=>{
                    if (void 0 === this.masterSwarmId)
                        return;
                    const n = await this.segmentsStorage.getSegment(t, this.masterSwarmId);
                    n && n.data ? e.sendSegmentData(t, n.data) : e.sendSegmentAbsent(t)
                }
                ,
                this.onSegmentLoaded = async(e,t,n)=>{
                    const r = this.peerSegmentRequests.get(t);
                    if (!r)
                        return;
                    const i = r.segment;
                    if (this.settings.segmentValidator)
                        try {
                            await this.settings.segmentValidator(Object.assign(Object.assign({}, i), {
                                data: n
                            }), "p2p", e.id)
                        } catch (n) {
                            return this.debug("segment validator failed", n),
                            this.peerSegmentRequests.delete(t),
                            this.emit("segment-error", i, n, e.id),
                            void this.onPeerClose(e)
                        }
                    this.peerSegmentRequests.delete(t),
                    this.emit("segment-loaded", i, n, e.id)
                }
                ,
                this.onSegmentAbsent = (e,t)=>{
                    this.peerSegmentRequests.delete(t),
                    this.emit("peer-data-updated")
                }
                ,
                this.onSegmentError = (e,t,n)=>{
                    const r = this.peerSegmentRequests.get(t);
                    r && (this.peerSegmentRequests.delete(t),
                    this.emit("segment-error", r.segment, n, e.id))
                }
                ,
                this.onSegmentTimeout = (e,t)=>{
                    const n = this.peerSegmentRequests.get(t);
                    n && (this.peerSegmentRequests.delete(t),
                    e.destroy(),
                    this.peers.delete(n.peerId) && this.emit("peer-data-updated"))
                }
                ,
                this.peerId = t.useP2P ? function() {
                    const e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                    let t = l;
                    for (let n = 0; n < 20 - l.length; n++)
                        t += e.charAt(Math.floor(Math.random() * e.length));
                    return (new TextEncoder).encode(t).buffer
                }() : new ArrayBuffer(0),
                this.debug.enabled && this.debug("peer ID", this.getPeerId(), (new TextDecoder).decode(this.peerId))
            }
        }
        n.P2PMediaManager = f
    }
    , {
        "./index": "p2p-media-loader-core",
        "./media-peer": 6,
        "./stringly-typed-event-emitter": 9,
        "bittorrent-tracker/client": 11,
        buffer: "buffer",
        debug: "debug",
        "sha.js/sha1": 44
    }],
    8: [function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.SegmentsMemoryStorage = void 0;
        n.SegmentsMemoryStorage = class {
            constructor(e) {
                this.settings = e,
                this.cache = new Map,
                this.storeSegment = async e=>{
                    this.cache.set(e.id, {
                        segment: e,
                        lastAccessed: performance.now()
                    })
                }
                ,
                this.getSegmentsMap = async()=>this.cache,
                this.getSegment = async e=>{
                    const t = this.cache.get(e);
                    if (void 0 !== t)
                        return t.lastAccessed = performance.now(),
                        t.segment
                }
                ,
                this.hasSegment = async e=>this.cache.has(e),
                this.clean = async(e,t)=>{
                    const n = []
                      , r = []
                      , i = performance.now();
                    for (const e of this.cache.values())
                        i - e.lastAccessed > this.settings.cachedSegmentExpiration ? n.push(e.segment.id) : r.push(e);
                    let s = r.length - this.settings.cachedSegmentsCount;
                    if (s > 0) {
                        r.sort(((e,t)=>e.lastAccessed - t.lastAccessed));
                        for (const e of r)
                            if ((void 0 === t || !t(e.segment.id)) && (n.push(e.segment.id),
                            s--,
                            0 === s))
                                break
                    }
                    return n.forEach((e=>this.cache.delete(e))),
                    n.length > 0
                }
                ,
                this.destroy = async()=>{
                    this.cache.clear()
                }
            }
        }
    }
    , {}],
    9: [function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.STEEmitter = void 0;
        const r = e("events");
        class i extends r.EventEmitter {
            constructor() {
                super(...arguments),
                this.on = (e,t)=>super.on(e, t),
                this.emit = (e,...t)=>super.emit(e, ...t)
            }
        }
        n.STEEmitter = i
    }
    , {
        events: "events"
    }],
    10: [function(e, t, n) {
        "use strict";
        n.byteLength = function(e) {
            var t = u(e)
              , n = t[0]
              , r = t[1];
            return 3 * (n + r) / 4 - r
        }
        ,
        n.toByteArray = function(e) {
            var t, n, r = u(e), o = r[0], a = r[1], h = new s(function(e, t, n) {
                return 3 * (t + n) / 4 - n
            }(0, o, a)), c = 0, l = a > 0 ? o - 4 : o;
            for (n = 0; n < l; n += 4)
                t = i[e.charCodeAt(n)] << 18 | i[e.charCodeAt(n + 1)] << 12 | i[e.charCodeAt(n + 2)] << 6 | i[e.charCodeAt(n + 3)],
                h[c++] = t >> 16 & 255,
                h[c++] = t >> 8 & 255,
                h[c++] = 255 & t;
            2 === a && (t = i[e.charCodeAt(n)] << 2 | i[e.charCodeAt(n + 1)] >> 4,
            h[c++] = 255 & t);
            1 === a && (t = i[e.charCodeAt(n)] << 10 | i[e.charCodeAt(n + 1)] << 4 | i[e.charCodeAt(n + 2)] >> 2,
            h[c++] = t >> 8 & 255,
            h[c++] = 255 & t);
            return h
        }
        ,
        n.fromByteArray = function(e) {
            for (var t, n = e.length, i = n % 3, s = [], o = 16383, a = 0, h = n - i; a < h; a += o)
                s.push(c(e, a, a + o > h ? h : a + o));
            1 === i ? (t = e[n - 1],
            s.push(r[t >> 2] + r[t << 4 & 63] + "==")) : 2 === i && (t = (e[n - 2] << 8) + e[n - 1],
            s.push(r[t >> 10] + r[t >> 4 & 63] + r[t << 2 & 63] + "="));
            return s.join("")
        }
        ;
        for (var r = [], i = [], s = "undefined" != typeof Uint8Array ? Uint8Array : Array, o = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", a = 0, h = o.length; a < h; ++a)
            r[a] = o[a],
            i[o.charCodeAt(a)] = a;
        function u(e) {
            var t = e.length;
            if (t % 4 > 0)
                throw new Error("Invalid string. Length must be a multiple of 4");
            var n = e.indexOf("=");
            return -1 === n && (n = t),
            [n, n === t ? 0 : 4 - n % 4]
        }
        function c(e, t, n) {
            for (var i, s, o = [], a = t; a < n; a += 3)
                i = (e[a] << 16 & 16711680) + (e[a + 1] << 8 & 65280) + (255 & e[a + 2]),
                o.push(r[(s = i) >> 18 & 63] + r[s >> 12 & 63] + r[s >> 6 & 63] + r[63 & s]);
            return o.join("")
        }
        i["-".charCodeAt(0)] = 62,
        i["_".charCodeAt(0)] = 63
    }
    , {}],
    11: [function(e, t, n) {
        (function(n, r) {
            (function() {
                const i = e("debug")("bittorrent-tracker:client")
                  , s = e("events")
                  , o = e("once")
                  , a = e("run-parallel")
                  , h = e("simple-peer")
                  , u = e("queue-microtask")
                  , c = e("./lib/common")
                  , l = e("./lib/client/http-tracker")
                  , d = e("./lib/client/udp-tracker")
                  , f = e("./lib/client/websocket-tracker");
                class p extends s {
                    constructor(e={}) {
                        if (super(),
                        !e.peerId)
                            throw new Error("Option `peerId` is required");
                        if (!e.infoHash)
                            throw new Error("Option `infoHash` is required");
                        if (!e.announce)
                            throw new Error("Option `announce` is required");
                        if (!n.browser && !e.port)
                            throw new Error("Option `port` is required");
                        this.peerId = "string" == typeof e.peerId ? e.peerId : e.peerId.toString("hex"),
                        this._peerIdBuffer = r.from(this.peerId, "hex"),
                        this._peerIdBinary = this._peerIdBuffer.toString("binary"),
                        this.infoHash = "string" == typeof e.infoHash ? e.infoHash.toLowerCase() : e.infoHash.toString("hex"),
                        this._infoHashBuffer = r.from(this.infoHash, "hex"),
                        this._infoHashBinary = this._infoHashBuffer.toString("binary"),
                        i("new client %s", this.infoHash),
                        this.destroyed = !1,
                        this._port = e.port,
                        this._getAnnounceOpts = e.getAnnounceOpts,
                        this._rtcConfig = e.rtcConfig,
                        this._userAgent = e.userAgent,
                        this._wrtc = "function" == typeof e.wrtc ? e.wrtc() : e.wrtc;
                        let t = "string" == typeof e.announce ? [e.announce] : null == e.announce ? [] : e.announce;
                        t = t.map((e=>("/" === (e = e.toString())[e.length - 1] && (e = e.substring(0, e.length - 1)),
                        e))),
                        t = Array.from(new Set(t));
                        const s = !1 !== this._wrtc && (!!this._wrtc || h.WEBRTC_SUPPORT)
                          , o = e=>{
                            u((()=>{
                                this.emit("warning", e)
                            }
                            ))
                        }
                        ;
                        this._trackers = t.map((e=>{
                            let t;
                            try {
                                t = c.parseUrl(e)
                            } catch (t) {
                                return o(new Error(`Invalid tracker URL: ${e}`)),
                                null
                            }
                            const n = t.port;
                            if (n < 0 || n > 65535)
                                return o(new Error(`Invalid tracker port: ${e}`)),
                                null;
                            const r = t.protocol;
                            return "http:" !== r && "https:" !== r || "function" != typeof l ? "udp:" === r && "function" == typeof d ? new d(this,e) : "ws:" !== r && "wss:" !== r || !s || "ws:" === r && "undefined" != typeof window && "https:" === window.location.protocol ? (o(new Error(`Unsupported tracker protocol: ${e}`)),
                            null) : new f(this,e) : new l(this,e)
                        }
                        )).filter(Boolean)
                    }
                    start(e) {
                        (e = this._defaultAnnounceOpts(e)).event = "started",
                        i("send `start` %o", e),
                        this._announce(e),
                        this._trackers.forEach((e=>{
                            e.setInterval()
                        }
                        ))
                    }
                    stop(e) {
                        (e = this._defaultAnnounceOpts(e)).event = "stopped",
                        i("send `stop` %o", e),
                        this._announce(e)
                    }
                    complete(e) {
                        e || (e = {}),
                        (e = this._defaultAnnounceOpts(e)).event = "completed",
                        i("send `complete` %o", e),
                        this._announce(e)
                    }
                    update(e) {
                        (e = this._defaultAnnounceOpts(e)).event && delete e.event,
                        i("send `update` %o", e),
                        this._announce(e)
                    }
                    _announce(e) {
                        this._trackers.forEach((t=>{
                            t.announce(e)
                        }
                        ))
                    }
                    scrape(e) {
                        i("send `scrape`"),
                        e || (e = {}),
                        this._trackers.forEach((t=>{
                            t.scrape(e)
                        }
                        ))
                    }
                    setInterval(e) {
                        i("setInterval %d", e),
                        this._trackers.forEach((t=>{
                            t.setInterval(e)
                        }
                        ))
                    }
                    destroy(e) {
                        if (this.destroyed)
                            return;
                        this.destroyed = !0,
                        i("destroy");
                        const t = this._trackers.map((e=>t=>{
                            e.destroy(t)
                        }
                        ));
                        a(t, e),
                        this._trackers = [],
                        this._getAnnounceOpts = null
                    }
                    _defaultAnnounceOpts(e={}) {
                        return null == e.numwant && (e.numwant = c.DEFAULT_ANNOUNCE_PEERS),
                        null == e.uploaded && (e.uploaded = 0),
                        null == e.downloaded && (e.downloaded = 0),
                        this._getAnnounceOpts && (e = Object.assign({}, e, this._getAnnounceOpts())),
                        e
                    }
                }
                p.scrape = (e,t)=>{
                    if (t = o(t),
                    !e.infoHash)
                        throw new Error("Option `infoHash` is required");
                    if (!e.announce)
                        throw new Error("Option `announce` is required");
                    const n = Object.assign({}, e, {
                        infoHash: Array.isArray(e.infoHash) ? e.infoHash[0] : e.infoHash,
                        peerId: r.from("01234567890123456789"),
                        port: 6881
                    })
                      , i = new p(n);
                    i.once("error", t),
                    i.once("warning", t);
                    let s = Array.isArray(e.infoHash) ? e.infoHash.length : 1;
                    const a = {};
                    return i.on("scrape", (e=>{
                        if (s -= 1,
                        a[e.infoHash] = e,
                        0 === s) {
                            i.destroy();
                            const e = Object.keys(a);
                            1 === e.length ? t(null, a[e[0]]) : t(null, a)
                        }
                    }
                    )),
                    e.infoHash = Array.isArray(e.infoHash) ? e.infoHash.map((e=>r.from(e, "hex"))) : r.from(e.infoHash, "hex"),
                    i.scrape({
                        infoHash: e.infoHash
                    }),
                    i
                }
                ,
                t.exports = p
            }
            ).call(this)
        }
        ).call(this, e("_process"), e("buffer").Buffer)
    }
    , {
        "./lib/client/http-tracker": 15,
        "./lib/client/udp-tracker": 15,
        "./lib/client/websocket-tracker": 13,
        "./lib/common": 14,
        _process: 23,
        buffer: "buffer",
        debug: "debug",
        events: "events",
        once: 22,
        "queue-microtask": 24,
        "run-parallel": 41,
        "simple-peer": 45
    }],
    12: [function(e, t, n) {
        const r = e("events");
        t.exports = class extends r {
            constructor(e, t) {
                super(),
                this.client = e,
                this.announceUrl = t,
                this.interval = null,
                this.destroyed = !1
            }
            setInterval(e) {
                null == e && (e = this.DEFAULT_ANNOUNCE_INTERVAL),
                clearInterval(this.interval),
                e && (this.interval = setInterval((()=>{
                    this.announce(this.client._defaultAnnounceOpts())
                }
                ), e),
                this.interval.unref && this.interval.unref())
            }
        }
    }
    , {
        events: "events"
    }],
    13: [function(e, t, n) {
        const r = e("debug")("bittorrent-tracker:websocket-tracker")
          , i = e("simple-peer")
          , s = e("randombytes")
          , o = e("simple-websocket")
          , a = e("../common")
          , h = e("./tracker")
          , u = {};
        class c extends h {
            constructor(e, t) {
                super(e, t),
                r("new websocket tracker %s", t),
                this.peers = {},
                this.socket = null,
                this.reconnecting = !1,
                this.retries = 0,
                this.reconnectTimer = null,
                this.expectingResponse = !1,
                this._openSocket()
            }
            announce(e) {
                if (this.destroyed || this.reconnecting)
                    return;
                if (!this.socket.connected)
                    return void this.socket.once("connect", (()=>{
                        this.announce(e)
                    }
                    ));
                const t = Object.assign({}, e, {
                    action: "announce",
                    info_hash: this.client._infoHashBinary,
                    peer_id: this.client._peerIdBinary
                });
                if (this._trackerId && (t.trackerid = this._trackerId),
                "stopped" === e.event || "completed" === e.event)
                    this._send(t);
                else {
                    const n = Math.min(e.numwant, 5);
                    this._generateOffers(n, (e=>{
                        t.numwant = n,
                        t.offers = e,
                        this._send(t)
                    }
                    ))
                }
            }
            scrape(e) {
                if (this.destroyed || this.reconnecting)
                    return;
                if (!this.socket.connected)
                    return void this.socket.once("connect", (()=>{
                        this.scrape(e)
                    }
                    ));
                const t = {
                    action: "scrape",
                    info_hash: Array.isArray(e.infoHash) && e.infoHash.length > 0 ? e.infoHash.map((e=>e.toString("binary"))) : e.infoHash && e.infoHash.toString("binary") || this.client._infoHashBinary
                };
                this._send(t)
            }
            destroy(e=l) {
                if (this.destroyed)
                    return e(null);
                this.destroyed = !0,
                clearInterval(this.interval),
                clearTimeout(this.reconnectTimer);
                for (const e in this.peers) {
                    const t = this.peers[e];
                    clearTimeout(t.trackerTimeout),
                    t.destroy()
                }
                if (this.peers = null,
                this.socket && (this.socket.removeListener("connect", this._onSocketConnectBound),
                this.socket.removeListener("data", this._onSocketDataBound),
                this.socket.removeListener("close", this._onSocketCloseBound),
                this.socket.removeListener("error", this._onSocketErrorBound),
                this.socket = null),
                this._onSocketConnectBound = null,
                this._onSocketErrorBound = null,
                this._onSocketDataBound = null,
                this._onSocketCloseBound = null,
                u[this.announceUrl] && (u[this.announceUrl].consumers -= 1),
                u[this.announceUrl].consumers > 0)
                    return e();
                let t, n = u[this.announceUrl];
                if (delete u[this.announceUrl],
                n.on("error", l),
                n.once("close", e),
                !this.expectingResponse)
                    return r();
                function r() {
                    t && (clearTimeout(t),
                    t = null),
                    n.removeListener("data", r),
                    n.destroy(),
                    n = null
                }
                t = setTimeout(r, a.DESTROY_TIMEOUT),
                n.once("data", r)
            }
            _openSocket() {
                this.destroyed = !1,
                this.peers || (this.peers = {}),
                this._onSocketConnectBound = ()=>{
                    this._onSocketConnect()
                }
                ,
                this._onSocketErrorBound = e=>{
                    this._onSocketError(e)
                }
                ,
                this._onSocketDataBound = e=>{
                    this._onSocketData(e)
                }
                ,
                this._onSocketCloseBound = ()=>{
                    this._onSocketClose()
                }
                ,
                this.socket = u[this.announceUrl],
                this.socket ? (u[this.announceUrl].consumers += 1,
                this.socket.connected && this._onSocketConnectBound()) : (this.socket = u[this.announceUrl] = new o(this.announceUrl),
                this.socket.consumers = 1,
                this.socket.once("connect", this._onSocketConnectBound)),
                this.socket.on("data", this._onSocketDataBound),
                this.socket.once("close", this._onSocketCloseBound),
                this.socket.once("error", this._onSocketErrorBound)
            }
            _onSocketConnect() {
                this.destroyed || this.reconnecting && (this.reconnecting = !1,
                this.retries = 0,
                this.announce(this.client._defaultAnnounceOpts()))
            }
            _onSocketData(e) {
                if (!this.destroyed) {
                    this.expectingResponse = !1;
                    try {
                        e = JSON.parse(e)
                    } catch (e) {
                        return void this.client.emit("warning", new Error("Invalid tracker response"))
                    }
                    "announce" === e.action ? this._onAnnounceResponse(e) : "scrape" === e.action ? this._onScrapeResponse(e) : this._onSocketError(new Error(`invalid action in WS response: ${e.action}`))
                }
            }
            _onAnnounceResponse(e) {
                if (e.info_hash !== this.client._infoHashBinary)
                    return void r("ignoring websocket data from %s for %s (looking for %s: reused socket)", this.announceUrl, a.binaryToHex(e.info_hash), this.client.infoHash);
                if (e.peer_id && e.peer_id === this.client._peerIdBinary)
                    return;
                r("received %s from %s for %s", JSON.stringify(e), this.announceUrl, this.client.infoHash);
                const t = e["failure reason"];
                if (t)
                    return this.client.emit("warning", new Error(t));
                const n = e["warning message"];
                n && this.client.emit("warning", new Error(n));
                const i = e.interval || e["min interval"];
                i && this.setInterval(1e3 * i);
                const s = e["tracker id"];
                if (s && (this._trackerId = s),
                null != e.complete) {
                    const t = Object.assign({}, e, {
                        announce: this.announceUrl,
                        infoHash: a.binaryToHex(e.info_hash)
                    });
                    this.client.emit("update", t)
                }
                let o;
                if (e.offer && e.peer_id && (r("creating peer (from remote offer)"),
                o = this._createPeer(),
                o.id = a.binaryToHex(e.peer_id),
                o.once("signal", (t=>{
                    const n = {
                        action: "announce",
                        info_hash: this.client._infoHashBinary,
                        peer_id: this.client._peerIdBinary,
                        to_peer_id: e.peer_id,
                        answer: t,
                        offer_id: e.offer_id
                    };
                    this._trackerId && (n.trackerid = this._trackerId),
                    this._send(n)
                }
                )),
                this.client.emit("peer", o),
                o.signal(e.offer)),
                e.answer && e.peer_id) {
                    const t = a.binaryToHex(e.offer_id);
                    o = this.peers[t],
                    o ? (o.id = a.binaryToHex(e.peer_id),
                    this.client.emit("peer", o),
                    o.signal(e.answer),
                    clearTimeout(o.trackerTimeout),
                    o.trackerTimeout = null,
                    delete this.peers[t]) : r(`got unexpected answer: ${JSON.stringify(e.answer)}`)
                }
            }
            _onScrapeResponse(e) {
                e = e.files || {};
                const t = Object.keys(e);
                0 !== t.length ? t.forEach((t=>{
                    const n = Object.assign(e[t], {
                        announce: this.announceUrl,
                        infoHash: a.binaryToHex(t)
                    });
                    this.client.emit("scrape", n)
                }
                )) : this.client.emit("warning", new Error("invalid scrape response"))
            }
            _onSocketClose() {
                this.destroyed || (this.destroy(),
                this._startReconnectTimer())
            }
            _onSocketError(e) {
                this.destroyed || (this.destroy(),
                this.client.emit("warning", e),
                this._startReconnectTimer())
            }
            _startReconnectTimer() {
                const e = Math.floor(3e5 * Math.random()) + Math.min(1e4 * Math.pow(2, this.retries), 36e5);
                this.reconnecting = !0,
                clearTimeout(this.reconnectTimer),
                this.reconnectTimer = setTimeout((()=>{
                    this.retries++,
                    this._openSocket()
                }
                ), e),
                this.reconnectTimer.unref && this.reconnectTimer.unref(),
                r("reconnecting socket in %s ms", e)
            }
            _send(e) {
                if (this.destroyed)
                    return;
                this.expectingResponse = !0;
                const t = JSON.stringify(e);
                r("send %s", t),
                this.socket.send(t)
            }
            _generateOffers(e, t) {
                const n = this
                  , i = [];
                r("generating %s offers", e);
                for (let t = 0; t < e; ++t)
                    o();
                function o() {
                    const e = s(20).toString("hex");
                    r("creating peer (from _generateOffers)");
                    const t = n.peers[e] = n._createPeer({
                        initiator: !0
                    });
                    t.once("signal", (t=>{
                        i.push({
                            offer: t,
                            offer_id: a.hexToBinary(e)
                        }),
                        h()
                    }
                    )),
                    t.trackerTimeout = setTimeout((()=>{
                        r("tracker timeout: destroying peer"),
                        t.trackerTimeout = null,
                        delete n.peers[e],
                        t.destroy()
                    }
                    ), 5e4),
                    t.trackerTimeout.unref && t.trackerTimeout.unref()
                }
                function h() {
                    i.length === e && (r("generated %s offers", e),
                    t(i))
                }
                h()
            }
            _createPeer(e) {
                const t = this;
                e = Object.assign({
                    trickle: !1,
                    config: t.client._rtcConfig,
                    wrtc: t.client._wrtc
                }, e);
                const n = new i(e);
                return n.once("error", r),
                n.once("connect", (function e() {
                    n.removeListener("error", r),
                    n.removeListener("connect", e)
                }
                )),
                n;
                function r(e) {
                    t.client.emit("warning", new Error(`Connection error: ${e.message}`)),
                    n.destroy()
                }
            }
        }
        function l() {}
        c.prototype.DEFAULT_ANNOUNCE_INTERVAL = 3e4,
        c._socketPool = u,
        t.exports = c
    }
    , {
        "../common": 14,
        "./tracker": 12,
        debug: "debug",
        randombytes: 25,
        "simple-peer": 45,
        "simple-websocket": 46
    }],
    14: [function(e, t, n) {
        (function(t) {
            (function() {
                n.DEFAULT_ANNOUNCE_PEERS = 50,
                n.MAX_ANNOUNCE_PEERS = 82,
                n.binaryToHex = e=>("string" != typeof e && (e = String(e)),
                t.from(e, "binary").toString("hex")),
                n.hexToBinary = e=>("string" != typeof e && (e = String(e)),
                t.from(e, "hex").toString("binary")),
                n.parseUrl = e=>{
                    const t = new URL(e.replace(/^udp:/, "http:"));
                    return e.match(/^udp:/) && Object.defineProperties(t, {
                        href: {
                            value: t.href.replace(/^http/, "udp")
                        },
                        protocol: {
                            value: t.protocol.replace(/^http/, "udp")
                        },
                        origin: {
                            value: t.origin.replace(/^http/, "udp")
                        }
                    }),
                    t
                }
                ;
                const r = e("./common-node");
                Object.assign(n, r)
            }
            ).call(this)
        }
        ).call(this, e("buffer").Buffer)
    }
    , {
        "./common-node": 15,
        buffer: "buffer"
    }],
    15: [function(e, t, n) {}
    , {}],
    16: [function(e, t, n) {
        t.exports = function(t) {
            function n(e) {
                let t, i = null;
                function s(...e) {
                    if (!s.enabled)
                        return;
                    const r = s
                      , i = Number(new Date)
                      , o = i - (t || i);
                    r.diff = o,
                    r.prev = t,
                    r.curr = i,
                    t = i,
                    e[0] = n.coerce(e[0]),
                    "string" != typeof e[0] && e.unshift("%O");
                    let a = 0;
                    e[0] = e[0].replace(/%([a-zA-Z%])/g, ((t,i)=>{
                        if ("%%" === t)
                            return "%";
                        a++;
                        const s = n.formatters[i];
                        if ("function" == typeof s) {
                            const n = e[a];
                            t = s.call(r, n),
                            e.splice(a, 1),
                            a--
                        }
                        return t
                    }
                    )),
                    n.formatArgs.call(r, e);
                    (r.log || n.log).apply(r, e)
                }
                return s.namespace = e,
                s.useColors = n.useColors(),
                s.color = n.selectColor(e),
                s.extend = r,
                s.destroy = n.destroy,
                Object.defineProperty(s, "enabled", {
                    enumerable: !0,
                    configurable: !1,
                    get: ()=>null === i ? n.enabled(e) : i,
                    set: e=>{
                        i = e
                    }
                }),
                "function" == typeof n.init && n.init(s),
                s
            }
            function r(e, t) {
                const r = n(this.namespace + (void 0 === t ? ":" : t) + e);
                return r.log = this.log,
                r
            }
            function i(e) {
                return e.toString().substring(2, e.toString().length - 2).replace(/\.\*\?$/, "*")
            }
            return n.debug = n,
            n.default = n,
            n.coerce = function(e) {
                if (e instanceof Error)
                    return e.stack || e.message;
                return e
            }
            ,
            n.disable = function() {
                const e = [...n.names.map(i), ...n.skips.map(i).map((e=>"-" + e))].join(",");
                return n.enable(""),
                e
            }
            ,
            n.enable = function(e) {
                let t;
                n.save(e),
                n.names = [],
                n.skips = [];
                const r = ("string" == typeof e ? e : "").split(/[\s,]+/)
                  , i = r.length;
                for (t = 0; t < i; t++)
                    r[t] && ("-" === (e = r[t].replace(/\*/g, ".*?"))[0] ? n.skips.push(new RegExp("^" + e.substr(1) + "$")) : n.names.push(new RegExp("^" + e + "$")))
            }
            ,
            n.enabled = function(e) {
                if ("*" === e[e.length - 1])
                    return !0;
                let t, r;
                for (t = 0,
                r = n.skips.length; t < r; t++)
                    if (n.skips[t].test(e))
                        return !1;
                for (t = 0,
                r = n.names.length; t < r; t++)
                    if (n.names[t].test(e))
                        return !0;
                return !1
            }
            ,
            n.humanize = e("ms"),
            n.destroy = function() {
                console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")
            }
            ,
            Object.keys(t).forEach((e=>{
                n[e] = t[e]
            }
            )),
            n.names = [],
            n.skips = [],
            n.formatters = {},
            n.selectColor = function(e) {
                let t = 0;
                for (let n = 0; n < e.length; n++)
                    t = (t << 5) - t + e.charCodeAt(n),
                    t |= 0;
                return n.colors[Math.abs(t) % n.colors.length]
            }
            ,
            n.enable(n.load()),
            n
        }
    }
    , {
        ms: 21
    }],
    17: [function(e, t, n) {
        "use strict";
        function r(e, t) {
            for (const n in t)
                Object.defineProperty(e, n, {
                    value: t[n],
                    enumerable: !0,
                    configurable: !0
                });
            return e
        }
        t.exports = function(e, t, n) {
            if (!e || "string" == typeof e)
                throw new TypeError("Please pass an Error to err-code");
            n || (n = {}),
            "object" == typeof t && (n = t,
            t = ""),
            t && (n.code = t);
            try {
                return r(e, n)
            } catch (t) {
                n.message = e.message,
                n.stack = e.stack;
                const i = function() {};
                i.prototype = Object.create(Object.getPrototypeOf(e));
                return r(new i, n)
            }
        }
    }
    , {}],
    18: [function(e, t, n) {
        t.exports = function() {
            if ("undefined" == typeof globalThis)
                return null;
            var e = {
                RTCPeerConnection: globalThis.RTCPeerConnection || globalThis.mozRTCPeerConnection || globalThis.webkitRTCPeerConnection,
                RTCSessionDescription: globalThis.RTCSessionDescription || globalThis.mozRTCSessionDescription || globalThis.webkitRTCSessionDescription,
                RTCIceCandidate: globalThis.RTCIceCandidate || globalThis.mozRTCIceCandidate || globalThis.webkitRTCIceCandidate
            };
            return e.RTCPeerConnection ? e : null
        }
    }
    , {}],
    19: [function(e, t, n) {
        n.read = function(e, t, n, r, i) {
            var s, o, a = 8 * i - r - 1, h = (1 << a) - 1, u = h >> 1, c = -7, l = n ? i - 1 : 0, d = n ? -1 : 1, f = e[t + l];
            for (l += d,
            s = f & (1 << -c) - 1,
            f >>= -c,
            c += a; c > 0; s = 256 * s + e[t + l],
            l += d,
            c -= 8)
                ;
            for (o = s & (1 << -c) - 1,
            s >>= -c,
            c += r; c > 0; o = 256 * o + e[t + l],
            l += d,
            c -= 8)
                ;
            if (0 === s)
                s = 1 - u;
            else {
                if (s === h)
                    return o ? NaN : 1 / 0 * (f ? -1 : 1);
                o += Math.pow(2, r),
                s -= u
            }
            return (f ? -1 : 1) * o * Math.pow(2, s - r)
        }
        ,
        n.write = function(e, t, n, r, i, s) {
            var o, a, h, u = 8 * s - i - 1, c = (1 << u) - 1, l = c >> 1, d = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0, f = r ? 0 : s - 1, p = r ? 1 : -1, g = t < 0 || 0 === t && 1 / t < 0 ? 1 : 0;
            for (t = Math.abs(t),
            isNaN(t) || t === 1 / 0 ? (a = isNaN(t) ? 1 : 0,
            o = c) : (o = Math.floor(Math.log(t) / Math.LN2),
            t * (h = Math.pow(2, -o)) < 1 && (o--,
            h *= 2),
            (t += o + l >= 1 ? d / h : d * Math.pow(2, 1 - l)) * h >= 2 && (o++,
            h /= 2),
            o + l >= c ? (a = 0,
            o = c) : o + l >= 1 ? (a = (t * h - 1) * Math.pow(2, i),
            o += l) : (a = t * Math.pow(2, l - 1) * Math.pow(2, i),
            o = 0)); i >= 8; e[n + f] = 255 & a,
            f += p,
            a /= 256,
            i -= 8)
                ;
            for (o = o << i | a,
            u += i; u > 0; e[n + f] = 255 & o,
            f += p,
            o /= 256,
            u -= 8)
                ;
            e[n + f - p] |= 128 * g
        }
    }
    , {}],
    20: [function(e, t, n) {
        "function" == typeof Object.create ? t.exports = function(e, t) {
            t && (e.super_ = t,
            e.prototype = Object.create(t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }))
        }
        : t.exports = function(e, t) {
            if (t) {
                e.super_ = t;
                var n = function() {};
                n.prototype = t.prototype,
                e.prototype = new n,
                e.prototype.constructor = e
            }
        }
    }
    , {}],
    21: [function(e, t, n) {
        var r = 1e3
          , i = 60 * r
          , s = 60 * i
          , o = 24 * s
          , a = 7 * o
          , h = 365.25 * o;
        function u(e, t, n, r) {
            var i = t >= 1.5 * n;
            return Math.round(e / n) + " " + r + (i ? "s" : "")
        }
        t.exports = function(e, t) {
            t = t || {};
            var n = typeof e;
            if ("string" === n && e.length > 0)
                return function(e) {
                    if ((e = String(e)).length > 100)
                        return;
                    var t = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);
                    if (!t)
                        return;
                    var n = parseFloat(t[1]);
                    switch ((t[2] || "ms").toLowerCase()) {
                    case "years":
                    case "year":
                    case "yrs":
                    case "yr":
                    case "y":
                        return n * h;
                    case "weeks":
                    case "week":
                    case "w":
                        return n * a;
                    case "days":
                    case "day":
                    case "d":
                        return n * o;
                    case "hours":
                    case "hour":
                    case "hrs":
                    case "hr":
                    case "h":
                        return n * s;
                    case "minutes":
                    case "minute":
                    case "mins":
                    case "min":
                    case "m":
                        return n * i;
                    case "seconds":
                    case "second":
                    case "secs":
                    case "sec":
                    case "s":
                        return n * r;
                    case "milliseconds":
                    case "millisecond":
                    case "msecs":
                    case "msec":
                    case "ms":
                        return n;
                    default:
                        return
                    }
                }(e);
            if ("number" === n && isFinite(e))
                return t.long ? function(e) {
                    var t = Math.abs(e);
                    if (t >= o)
                        return u(e, t, o, "day");
                    if (t >= s)
                        return u(e, t, s, "hour");
                    if (t >= i)
                        return u(e, t, i, "minute");
                    if (t >= r)
                        return u(e, t, r, "second");
                    return e + " ms"
                }(e) : function(e) {
                    var t = Math.abs(e);
                    if (t >= o)
                        return Math.round(e / o) + "d";
                    if (t >= s)
                        return Math.round(e / s) + "h";
                    if (t >= i)
                        return Math.round(e / i) + "m";
                    if (t >= r)
                        return Math.round(e / r) + "s";
                    return e + "ms"
                }(e);
            throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(e))
        }
    }
    , {}],
    22: [function(e, t, n) {
        var r = e("wrappy");
        function i(e) {
            var t = function() {
                return t.called ? t.value : (t.called = !0,
                t.value = e.apply(this, arguments))
            };
            return t.called = !1,
            t
        }
        function s(e) {
            var t = function() {
                if (t.called)
                    throw new Error(t.onceError);
                return t.called = !0,
                t.value = e.apply(this, arguments)
            }
              , n = e.name || "Function wrapped with `once`";
            return t.onceError = n + " shouldn't be called more than once",
            t.called = !1,
            t
        }
        t.exports = r(i),
        t.exports.strict = r(s),
        i.proto = i((function() {
            Object.defineProperty(Function.prototype, "once", {
                value: function() {
                    return i(this)
                },
                configurable: !0
            }),
            Object.defineProperty(Function.prototype, "onceStrict", {
                value: function() {
                    return s(this)
                },
                configurable: !0
            })
        }
        ))
    }
    , {
        wrappy: 49
    }],
    23: [function(e, t, n) {
        var r, i, s = t.exports = {};
        function o() {
            throw new Error("setTimeout has not been defined")
        }
        function a() {
            throw new Error("clearTimeout has not been defined")
        }
        function h(e) {
            if (r === setTimeout)
                return setTimeout(e, 0);
            if ((r === o || !r) && setTimeout)
                return r = setTimeout,
                setTimeout(e, 0);
            try {
                return r(e, 0)
            } catch (t) {
                try {
                    return r.call(null, e, 0)
                } catch (t) {
                    return r.call(this, e, 0)
                }
            }
        }
        !function() {
            try {
                r = "function" == typeof setTimeout ? setTimeout : o
            } catch (e) {
                r = o
            }
            try {
                i = "function" == typeof clearTimeout ? clearTimeout : a
            } catch (e) {
                i = a
            }
        }();
        var u, c = [], l = !1, d = -1;
        function f() {
            l && u && (l = !1,
            u.length ? c = u.concat(c) : d = -1,
            c.length && p())
        }
        function p() {
            if (!l) {
                var e = h(f);
                l = !0;
                for (var t = c.length; t; ) {
                    for (u = c,
                    c = []; ++d < t; )
                        u && u[d].run();
                    d = -1,
                    t = c.length
                }
                u = null,
                l = !1,
                function(e) {
                    if (i === clearTimeout)
                        return clearTimeout(e);
                    if ((i === a || !i) && clearTimeout)
                        return i = clearTimeout,
                        clearTimeout(e);
                    try {
                        i(e)
                    } catch (t) {
                        try {
                            return i.call(null, e)
                        } catch (t) {
                            return i.call(this, e)
                        }
                    }
                }(e)
            }
        }
        function g(e, t) {
            this.fun = e,
            this.array = t
        }
        function m() {}
        s.nextTick = function(e) {
            var t = new Array(arguments.length - 1);
            if (arguments.length > 1)
                for (var n = 1; n < arguments.length; n++)
                    t[n - 1] = arguments[n];
            c.push(new g(e,t)),
            1 !== c.length || l || h(p)
        }
        ,
        g.prototype.run = function() {
            this.fun.apply(null, this.array)
        }
        ,
        s.title = "browser",
        s.browser = !0,
        s.env = {},
        s.argv = [],
        s.version = "",
        s.versions = {},
        s.on = m,
        s.addListener = m,
        s.once = m,
        s.off = m,
        s.removeListener = m,
        s.removeAllListeners = m,
        s.emit = m,
        s.prependListener = m,
        s.prependOnceListener = m,
        s.listeners = function(e) {
            return []
        }
        ,
        s.binding = function(e) {
            throw new Error("process.binding is not supported")
        }
        ,
        s.cwd = function() {
            return "/"
        }
        ,
        s.chdir = function(e) {
            throw new Error("process.chdir is not supported")
        }
        ,
        s.umask = function() {
            return 0
        }
    }
    , {}],
    24: [function(e, t, n) {
        (function(e) {
            (function() {
                let n;
                t.exports = "function" == typeof queueMicrotask ? queueMicrotask.bind("undefined" != typeof window ? window : e) : e=>(n || (n = Promise.resolve())).then(e).catch((e=>setTimeout((()=>{
                    throw e
                }
                ), 0)))
            }
            ).call(this)
        }
        ).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }
    , {}],
    25: [function(e, t, n) {
        (function(n, r) {
            (function() {
                "use strict";
                var i = 65536
                  , s = 4294967295;
                var o = e("safe-buffer").Buffer
                  , a = r.crypto || r.msCrypto;
                a && a.getRandomValues ? t.exports = function(e, t) {
                    if (e > s)
                        throw new RangeError("requested too many random bytes");
                    var r = o.allocUnsafe(e);
                    if (e > 0)
                        if (e > i)
                            for (var h = 0; h < e; h += i)
                                a.getRandomValues(r.slice(h, h + i));
                        else
                            a.getRandomValues(r);
                    if ("function" == typeof t)
                        return n.nextTick((function() {
                            t(null, r)
                        }
                        ));
                    return r
                }
                : t.exports = function() {
                    throw new Error("Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11")
                }
            }
            ).call(this)
        }
        ).call(this, e("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }
    , {
        _process: 23,
        "safe-buffer": 42
    }],
    26: [function(e, t, n) {
        "use strict";
        var r = {};
        function i(e, t, n) {
            n || (n = Error);
            var i = function(e) {
                var n, r;
                function i(n, r, i) {
                    return e.call(this, function(e, n, r) {
                        return "string" == typeof t ? t : t(e, n, r)
                    }(n, r, i)) || this
                }
                return r = e,
                (n = i).prototype = Object.create(r.prototype),
                n.prototype.constructor = n,
                n.__proto__ = r,
                i
            }(n);
            i.prototype.name = n.name,
            i.prototype.code = e,
            r[e] = i
        }
        function s(e, t) {
            if (Array.isArray(e)) {
                var n = e.length;
                return e = e.map((function(e) {
                    return String(e)
                }
                )),
                n > 2 ? "one of ".concat(t, " ").concat(e.slice(0, n - 1).join(", "), ", or ") + e[n - 1] : 2 === n ? "one of ".concat(t, " ").concat(e[0], " or ").concat(e[1]) : "of ".concat(t, " ").concat(e[0])
            }
            return "of ".concat(t, " ").concat(String(e))
        }
        i("ERR_INVALID_OPT_VALUE", (function(e, t) {
            return 'The value "' + t + '" is invalid for option "' + e + '"'
        }
        ), TypeError),
        i("ERR_INVALID_ARG_TYPE", (function(e, t, n) {
            var r, i, o, a;
            if ("string" == typeof t && (i = "not ",
            t.substr(!o || o < 0 ? 0 : +o, i.length) === i) ? (r = "must not be",
            t = t.replace(/^not /, "")) : r = "must be",
            function(e, t, n) {
                return (void 0 === n || n > e.length) && (n = e.length),
                e.substring(n - t.length, n) === t
            }(e, " argument"))
                a = "The ".concat(e, " ").concat(r, " ").concat(s(t, "type"));
            else {
                var h = function(e, t, n) {
                    return "number" != typeof n && (n = 0),
                    !(n + t.length > e.length) && -1 !== e.indexOf(t, n)
                }(e, ".") ? "property" : "argument";
                a = 'The "'.concat(e, '" ').concat(h, " ").concat(r, " ").concat(s(t, "type"))
            }
            return a += ". Received type ".concat(typeof n)
        }
        ), TypeError),
        i("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"),
        i("ERR_METHOD_NOT_IMPLEMENTED", (function(e) {
            return "The " + e + " method is not implemented"
        }
        )),
        i("ERR_STREAM_PREMATURE_CLOSE", "Premature close"),
        i("ERR_STREAM_DESTROYED", (function(e) {
            return "Cannot call " + e + " after a stream was destroyed"
        }
        )),
        i("ERR_MULTIPLE_CALLBACK", "Callback called multiple times"),
        i("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"),
        i("ERR_STREAM_WRITE_AFTER_END", "write after end"),
        i("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError),
        i("ERR_UNKNOWN_ENCODING", (function(e) {
            return "Unknown encoding: " + e
        }
        ), TypeError),
        i("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event"),
        t.exports.codes = r
    }
    , {}],
    27: [function(e, t, n) {
        (function(n) {
            (function() {
                "use strict";
                var r = Object.keys || function(e) {
                    var t = [];
                    for (var n in e)
                        t.push(n);
                    return t
                }
                ;
                t.exports = u;
                var i = e("./_stream_readable")
                  , s = e("./_stream_writable");
                e("inherits")(u, i);
                for (var o = r(s.prototype), a = 0; a < o.length; a++) {
                    var h = o[a];
                    u.prototype[h] || (u.prototype[h] = s.prototype[h])
                }
                function u(e) {
                    if (!(this instanceof u))
                        return new u(e);
                    i.call(this, e),
                    s.call(this, e),
                    this.allowHalfOpen = !0,
                    e && (!1 === e.readable && (this.readable = !1),
                    !1 === e.writable && (this.writable = !1),
                    !1 === e.allowHalfOpen && (this.allowHalfOpen = !1,
                    this.once("end", c)))
                }
                function c() {
                    this._writableState.ended || n.nextTick(l, this)
                }
                function l(e) {
                    e.end()
                }
                Object.defineProperty(u.prototype, "writableHighWaterMark", {
                    enumerable: !1,
                    get: function() {
                        return this._writableState.highWaterMark
                    }
                }),
                Object.defineProperty(u.prototype, "writableBuffer", {
                    enumerable: !1,
                    get: function() {
                        return this._writableState && this._writableState.getBuffer()
                    }
                }),
                Object.defineProperty(u.prototype, "writableLength", {
                    enumerable: !1,
                    get: function() {
                        return this._writableState.length
                    }
                }),
                Object.defineProperty(u.prototype, "destroyed", {
                    enumerable: !1,
                    get: function() {
                        return void 0 !== this._readableState && void 0 !== this._writableState && (this._readableState.destroyed && this._writableState.destroyed)
                    },
                    set: function(e) {
                        void 0 !== this._readableState && void 0 !== this._writableState && (this._readableState.destroyed = e,
                        this._writableState.destroyed = e)
                    }
                })
            }
            ).call(this)
        }
        ).call(this, e("_process"))
    }
    , {
        "./_stream_readable": 29,
        "./_stream_writable": 31,
        _process: 23,
        inherits: 20
    }],
    28: [function(e, t, n) {
        "use strict";
        t.exports = i;
        var r = e("./_stream_transform");
        function i(e) {
            if (!(this instanceof i))
                return new i(e);
            r.call(this, e)
        }
        e("inherits")(i, r),
        i.prototype._transform = function(e, t, n) {
            n(null, e)
        }
    }
    , {
        "./_stream_transform": 30,
        inherits: 20
    }],
    29: [function(e, t, n) {
        (function(n, r) {
            (function() {
                "use strict";
                var i;
                t.exports = R,
                R.ReadableState = C;
                e("events").EventEmitter;
                var s = function(e, t) {
                    return e.listeners(t).length
                }
                  , o = e("./internal/streams/stream")
                  , a = e("buffer").Buffer
                  , h = r.Uint8Array || function() {}
                ;
                var u, c = e("util");
                u = c && c.debuglog ? c.debuglog("stream") : function() {}
                ;
                var l, d, f, p = e("./internal/streams/buffer_list"), g = e("./internal/streams/destroy"), m = e("./internal/streams/state").getHighWaterMark, y = e("../errors").codes, b = y.ERR_INVALID_ARG_TYPE, _ = y.ERR_STREAM_PUSH_AFTER_EOF, w = y.ERR_METHOD_NOT_IMPLEMENTED, v = y.ERR_STREAM_UNSHIFT_AFTER_END_EVENT;
                e("inherits")(R, o);
                var S = g.errorOrDestroy
                  , E = ["error", "close", "destroy", "pause", "resume"];
                function C(t, n, r) {
                    i = i || e("./_stream_duplex"),
                    t = t || {},
                    "boolean" != typeof r && (r = n instanceof i),
                    this.objectMode = !!t.objectMode,
                    r && (this.objectMode = this.objectMode || !!t.readableObjectMode),
                    this.highWaterMark = m(this, t, "readableHighWaterMark", r),
                    this.buffer = new p,
                    this.length = 0,
                    this.pipes = null,
                    this.pipesCount = 0,
                    this.flowing = null,
                    this.ended = !1,
                    this.endEmitted = !1,
                    this.reading = !1,
                    this.sync = !0,
                    this.needReadable = !1,
                    this.emittedReadable = !1,
                    this.readableListening = !1,
                    this.resumeScheduled = !1,
                    this.paused = !0,
                    this.emitClose = !1 !== t.emitClose,
                    this.autoDestroy = !!t.autoDestroy,
                    this.destroyed = !1,
                    this.defaultEncoding = t.defaultEncoding || "utf8",
                    this.awaitDrain = 0,
                    this.readingMore = !1,
                    this.decoder = null,
                    this.encoding = null,
                    t.encoding && (l || (l = e("string_decoder/").StringDecoder),
                    this.decoder = new l(t.encoding),
                    this.encoding = t.encoding)
                }
                function R(t) {
                    if (i = i || e("./_stream_duplex"),
                    !(this instanceof R))
                        return new R(t);
                    var n = this instanceof i;
                    this._readableState = new C(t,this,n),
                    this.readable = !0,
                    t && ("function" == typeof t.read && (this._read = t.read),
                    "function" == typeof t.destroy && (this._destroy = t.destroy)),
                    o.call(this)
                }
                function T(e, t, n, r, i) {
                    u("readableAddChunk", t);
                    var s, o = e._readableState;
                    if (null === t)
                        o.reading = !1,
                        function(e, t) {
                            if (u("onEofChunk"),
                            t.ended)
                                return;
                            if (t.decoder) {
                                var n = t.decoder.end();
                                n && n.length && (t.buffer.push(n),
                                t.length += t.objectMode ? 1 : n.length)
                            }
                            t.ended = !0,
                            t.sync ? I(e) : (t.needReadable = !1,
                            t.emittedReadable || (t.emittedReadable = !0,
                            O(e)))
                        }(e, o);
                    else if (i || (s = function(e, t) {
                        var n;
                        r = t,
                        a.isBuffer(r) || r instanceof h || "string" == typeof t || void 0 === t || e.objectMode || (n = new b("chunk",["string", "Buffer", "Uint8Array"],t));
                        var r;
                        return n
                    }(o, t)),
                    s)
                        S(e, s);
                    else if (o.objectMode || t && t.length > 0)
                        if ("string" == typeof t || o.objectMode || Object.getPrototypeOf(t) === a.prototype || (t = function(e) {
                            return a.from(e)
                        }(t)),
                        r)
                            o.endEmitted ? S(e, new v) : k(e, o, t, !0);
                        else if (o.ended)
                            S(e, new _);
                        else {
                            if (o.destroyed)
                                return !1;
                            o.reading = !1,
                            o.decoder && !n ? (t = o.decoder.write(t),
                            o.objectMode || 0 !== t.length ? k(e, o, t, !1) : P(e, o)) : k(e, o, t, !1)
                        }
                    else
                        r || (o.reading = !1,
                        P(e, o));
                    return !o.ended && (o.length < o.highWaterMark || 0 === o.length)
                }
                function k(e, t, n, r) {
                    t.flowing && 0 === t.length && !t.sync ? (t.awaitDrain = 0,
                    e.emit("data", n)) : (t.length += t.objectMode ? 1 : n.length,
                    r ? t.buffer.unshift(n) : t.buffer.push(n),
                    t.needReadable && I(e)),
                    P(e, t)
                }
                Object.defineProperty(R.prototype, "destroyed", {
                    enumerable: !1,
                    get: function() {
                        return void 0 !== this._readableState && this._readableState.destroyed
                    },
                    set: function(e) {
                        this._readableState && (this._readableState.destroyed = e)
                    }
                }),
                R.prototype.destroy = g.destroy,
                R.prototype._undestroy = g.undestroy,
                R.prototype._destroy = function(e, t) {
                    t(e)
                }
                ,
                R.prototype.push = function(e, t) {
                    var n, r = this._readableState;
                    return r.objectMode ? n = !0 : "string" == typeof e && ((t = t || r.defaultEncoding) !== r.encoding && (e = a.from(e, t),
                    t = ""),
                    n = !0),
                    T(this, e, t, !1, n)
                }
                ,
                R.prototype.unshift = function(e) {
                    return T(this, e, null, !0, !1)
                }
                ,
                R.prototype.isPaused = function() {
                    return !1 === this._readableState.flowing
                }
                ,
                R.prototype.setEncoding = function(t) {
                    l || (l = e("string_decoder/").StringDecoder);
                    var n = new l(t);
                    this._readableState.decoder = n,
                    this._readableState.encoding = this._readableState.decoder.encoding;
                    for (var r = this._readableState.buffer.head, i = ""; null !== r; )
                        i += n.write(r.data),
                        r = r.next;
                    return this._readableState.buffer.clear(),
                    "" !== i && this._readableState.buffer.push(i),
                    this._readableState.length = i.length,
                    this
                }
                ;
                var M = 1073741824;
                function A(e, t) {
                    return e <= 0 || 0 === t.length && t.ended ? 0 : t.objectMode ? 1 : e != e ? t.flowing && t.length ? t.buffer.head.data.length : t.length : (e > t.highWaterMark && (t.highWaterMark = function(e) {
                        return e >= M ? e = M : (e--,
                        e |= e >>> 1,
                        e |= e >>> 2,
                        e |= e >>> 4,
                        e |= e >>> 8,
                        e |= e >>> 16,
                        e++),
                        e
                    }(e)),
                    e <= t.length ? e : t.ended ? t.length : (t.needReadable = !0,
                    0))
                }
                function I(e) {
                    var t = e._readableState;
                    u("emitReadable", t.needReadable, t.emittedReadable),
                    t.needReadable = !1,
                    t.emittedReadable || (u("emitReadable", t.flowing),
                    t.emittedReadable = !0,
                    n.nextTick(O, e))
                }
                function O(e) {
                    var t = e._readableState;
                    u("emitReadable_", t.destroyed, t.length, t.ended),
                    t.destroyed || !t.length && !t.ended || (e.emit("readable"),
                    t.emittedReadable = !1),
                    t.needReadable = !t.flowing && !t.ended && t.length <= t.highWaterMark,
                    N(e)
                }
                function P(e, t) {
                    t.readingMore || (t.readingMore = !0,
                    n.nextTick(D, e, t))
                }
                function D(e, t) {
                    for (; !t.reading && !t.ended && (t.length < t.highWaterMark || t.flowing && 0 === t.length); ) {
                        var n = t.length;
                        if (u("maybeReadMore read 0"),
                        e.read(0),
                        n === t.length)
                            break
                    }
                    t.readingMore = !1
                }
                function x(e) {
                    var t = e._readableState;
                    t.readableListening = e.listenerCount("readable") > 0,
                    t.resumeScheduled && !t.paused ? t.flowing = !0 : e.listenerCount("data") > 0 && e.resume()
                }
                function L(e) {
                    u("readable nexttick read 0"),
                    e.read(0)
                }
                function B(e, t) {
                    u("resume", t.reading),
                    t.reading || e.read(0),
                    t.resumeScheduled = !1,
                    e.emit("resume"),
                    N(e),
                    t.flowing && !t.reading && e.read(0)
                }
                function N(e) {
                    var t = e._readableState;
                    for (u("flow", t.flowing); t.flowing && null !== e.read(); )
                        ;
                }
                function j(e, t) {
                    return 0 === t.length ? null : (t.objectMode ? n = t.buffer.shift() : !e || e >= t.length ? (n = t.decoder ? t.buffer.join("") : 1 === t.buffer.length ? t.buffer.first() : t.buffer.concat(t.length),
                    t.buffer.clear()) : n = t.buffer.consume(e, t.decoder),
                    n);
                    var n
                }
                function U(e) {
                    var t = e._readableState;
                    u("endReadable", t.endEmitted),
                    t.endEmitted || (t.ended = !0,
                    n.nextTick(F, t, e))
                }
                function F(e, t) {
                    if (u("endReadableNT", e.endEmitted, e.length),
                    !e.endEmitted && 0 === e.length && (e.endEmitted = !0,
                    t.readable = !1,
                    t.emit("end"),
                    e.autoDestroy)) {
                        var n = t._writableState;
                        (!n || n.autoDestroy && n.finished) && t.destroy()
                    }
                }
                function q(e, t) {
                    for (var n = 0, r = e.length; n < r; n++)
                        if (e[n] === t)
                            return n;
                    return -1
                }
                R.prototype.read = function(e) {
                    u("read", e),
                    e = parseInt(e, 10);
                    var t = this._readableState
                      , n = e;
                    if (0 !== e && (t.emittedReadable = !1),
                    0 === e && t.needReadable && ((0 !== t.highWaterMark ? t.length >= t.highWaterMark : t.length > 0) || t.ended))
                        return u("read: emitReadable", t.length, t.ended),
                        0 === t.length && t.ended ? U(this) : I(this),
                        null;
                    if (0 === (e = A(e, t)) && t.ended)
                        return 0 === t.length && U(this),
                        null;
                    var r, i = t.needReadable;
                    return u("need readable", i),
                    (0 === t.length || t.length - e < t.highWaterMark) && u("length less than watermark", i = !0),
                    t.ended || t.reading ? u("reading or ended", i = !1) : i && (u("do read"),
                    t.reading = !0,
                    t.sync = !0,
                    0 === t.length && (t.needReadable = !0),
                    this._read(t.highWaterMark),
                    t.sync = !1,
                    t.reading || (e = A(n, t))),
                    null === (r = e > 0 ? j(e, t) : null) ? (t.needReadable = t.length <= t.highWaterMark,
                    e = 0) : (t.length -= e,
                    t.awaitDrain = 0),
                    0 === t.length && (t.ended || (t.needReadable = !0),
                    n !== e && t.ended && U(this)),
                    null !== r && this.emit("data", r),
                    r
                }
                ,
                R.prototype._read = function(e) {
                    S(this, new w("_read()"))
                }
                ,
                R.prototype.pipe = function(e, t) {
                    var r = this
                      , i = this._readableState;
                    switch (i.pipesCount) {
                    case 0:
                        i.pipes = e;
                        break;
                    case 1:
                        i.pipes = [i.pipes, e];
                        break;
                    default:
                        i.pipes.push(e)
                    }
                    i.pipesCount += 1,
                    u("pipe count=%d opts=%j", i.pipesCount, t);
                    var o = (!t || !1 !== t.end) && e !== n.stdout && e !== n.stderr ? h : m;
                    function a(t, n) {
                        u("onunpipe"),
                        t === r && n && !1 === n.hasUnpiped && (n.hasUnpiped = !0,
                        u("cleanup"),
                        e.removeListener("close", p),
                        e.removeListener("finish", g),
                        e.removeListener("drain", c),
                        e.removeListener("error", f),
                        e.removeListener("unpipe", a),
                        r.removeListener("end", h),
                        r.removeListener("end", m),
                        r.removeListener("data", d),
                        l = !0,
                        !i.awaitDrain || e._writableState && !e._writableState.needDrain || c())
                    }
                    function h() {
                        u("onend"),
                        e.end()
                    }
                    i.endEmitted ? n.nextTick(o) : r.once("end", o),
                    e.on("unpipe", a);
                    var c = function(e) {
                        return function() {
                            var t = e._readableState;
                            u("pipeOnDrain", t.awaitDrain),
                            t.awaitDrain && t.awaitDrain--,
                            0 === t.awaitDrain && s(e, "data") && (t.flowing = !0,
                            N(e))
                        }
                    }(r);
                    e.on("drain", c);
                    var l = !1;
                    function d(t) {
                        u("ondata");
                        var n = e.write(t);
                        u("dest.write", n),
                        !1 === n && ((1 === i.pipesCount && i.pipes === e || i.pipesCount > 1 && -1 !== q(i.pipes, e)) && !l && (u("false write response, pause", i.awaitDrain),
                        i.awaitDrain++),
                        r.pause())
                    }
                    function f(t) {
                        u("onerror", t),
                        m(),
                        e.removeListener("error", f),
                        0 === s(e, "error") && S(e, t)
                    }
                    function p() {
                        e.removeListener("finish", g),
                        m()
                    }
                    function g() {
                        u("onfinish"),
                        e.removeListener("close", p),
                        m()
                    }
                    function m() {
                        u("unpipe"),
                        r.unpipe(e)
                    }
                    return r.on("data", d),
                    function(e, t, n) {
                        if ("function" == typeof e.prependListener)
                            return e.prependListener(t, n);
                        e._events && e._events[t] ? Array.isArray(e._events[t]) ? e._events[t].unshift(n) : e._events[t] = [n, e._events[t]] : e.on(t, n)
                    }(e, "error", f),
                    e.once("close", p),
                    e.once("finish", g),
                    e.emit("pipe", r),
                    i.flowing || (u("pipe resume"),
                    r.resume()),
                    e
                }
                ,
                R.prototype.unpipe = function(e) {
                    var t = this._readableState
                      , n = {
                        hasUnpiped: !1
                    };
                    if (0 === t.pipesCount)
                        return this;
                    if (1 === t.pipesCount)
                        return e && e !== t.pipes || (e || (e = t.pipes),
                        t.pipes = null,
                        t.pipesCount = 0,
                        t.flowing = !1,
                        e && e.emit("unpipe", this, n)),
                        this;
                    if (!e) {
                        var r = t.pipes
                          , i = t.pipesCount;
                        t.pipes = null,
                        t.pipesCount = 0,
                        t.flowing = !1;
                        for (var s = 0; s < i; s++)
                            r[s].emit("unpipe", this, {
                                hasUnpiped: !1
                            });
                        return this
                    }
                    var o = q(t.pipes, e);
                    return -1 === o || (t.pipes.splice(o, 1),
                    t.pipesCount -= 1,
                    1 === t.pipesCount && (t.pipes = t.pipes[0]),
                    e.emit("unpipe", this, n)),
                    this
                }
                ,
                R.prototype.on = function(e, t) {
                    var r = o.prototype.on.call(this, e, t)
                      , i = this._readableState;
                    return "data" === e ? (i.readableListening = this.listenerCount("readable") > 0,
                    !1 !== i.flowing && this.resume()) : "readable" === e && (i.endEmitted || i.readableListening || (i.readableListening = i.needReadable = !0,
                    i.flowing = !1,
                    i.emittedReadable = !1,
                    u("on readable", i.length, i.reading),
                    i.length ? I(this) : i.reading || n.nextTick(L, this))),
                    r
                }
                ,
                R.prototype.addListener = R.prototype.on,
                R.prototype.removeListener = function(e, t) {
                    var r = o.prototype.removeListener.call(this, e, t);
                    return "readable" === e && n.nextTick(x, this),
                    r
                }
                ,
                R.prototype.removeAllListeners = function(e) {
                    var t = o.prototype.removeAllListeners.apply(this, arguments);
                    return "readable" !== e && void 0 !== e || n.nextTick(x, this),
                    t
                }
                ,
                R.prototype.resume = function() {
                    var e = this._readableState;
                    return e.flowing || (u("resume"),
                    e.flowing = !e.readableListening,
                    function(e, t) {
                        t.resumeScheduled || (t.resumeScheduled = !0,
                        n.nextTick(B, e, t))
                    }(this, e)),
                    e.paused = !1,
                    this
                }
                ,
                R.prototype.pause = function() {
                    return u("call pause flowing=%j", this._readableState.flowing),
                    !1 !== this._readableState.flowing && (u("pause"),
                    this._readableState.flowing = !1,
                    this.emit("pause")),
                    this._readableState.paused = !0,
                    this
                }
                ,
                R.prototype.wrap = function(e) {
                    var t = this
                      , n = this._readableState
                      , r = !1;
                    for (var i in e.on("end", (function() {
                        if (u("wrapped end"),
                        n.decoder && !n.ended) {
                            var e = n.decoder.end();
                            e && e.length && t.push(e)
                        }
                        t.push(null)
                    }
                    )),
                    e.on("data", (function(i) {
                        (u("wrapped data"),
                        n.decoder && (i = n.decoder.write(i)),
                        n.objectMode && null == i) || (n.objectMode || i && i.length) && (t.push(i) || (r = !0,
                        e.pause()))
                    }
                    )),
                    e)
                        void 0 === this[i] && "function" == typeof e[i] && (this[i] = function(t) {
                            return function() {
                                return e[t].apply(e, arguments)
                            }
                        }(i));
                    for (var s = 0; s < E.length; s++)
                        e.on(E[s], this.emit.bind(this, E[s]));
                    return this._read = function(t) {
                        u("wrapped _read", t),
                        r && (r = !1,
                        e.resume())
                    }
                    ,
                    this
                }
                ,
                "function" == typeof Symbol && (R.prototype[Symbol.asyncIterator] = function() {
                    return void 0 === d && (d = e("./internal/streams/async_iterator")),
                    d(this)
                }
                ),
                Object.defineProperty(R.prototype, "readableHighWaterMark", {
                    enumerable: !1,
                    get: function() {
                        return this._readableState.highWaterMark
                    }
                }),
                Object.defineProperty(R.prototype, "readableBuffer", {
                    enumerable: !1,
                    get: function() {
                        return this._readableState && this._readableState.buffer
                    }
                }),
                Object.defineProperty(R.prototype, "readableFlowing", {
                    enumerable: !1,
                    get: function() {
                        return this._readableState.flowing
                    },
                    set: function(e) {
                        this._readableState && (this._readableState.flowing = e)
                    }
                }),
                R._fromList = j,
                Object.defineProperty(R.prototype, "readableLength", {
                    enumerable: !1,
                    get: function() {
                        return this._readableState.length
                    }
                }),
                "function" == typeof Symbol && (R.from = function(t, n) {
                    return void 0 === f && (f = e("./internal/streams/from")),
                    f(R, t, n)
                }
                )
            }
            ).call(this)
        }
        ).call(this, e("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }
    , {
        "../errors": 26,
        "./_stream_duplex": 27,
        "./internal/streams/async_iterator": 32,
        "./internal/streams/buffer_list": 33,
        "./internal/streams/destroy": 34,
        "./internal/streams/from": 36,
        "./internal/streams/state": 38,
        "./internal/streams/stream": 39,
        _process: 23,
        buffer: "buffer",
        events: "events",
        inherits: 20,
        "string_decoder/": 47,
        util: 15
    }],
    30: [function(e, t, n) {
        "use strict";
        t.exports = c;
        var r = e("../errors").codes
          , i = r.ERR_METHOD_NOT_IMPLEMENTED
          , s = r.ERR_MULTIPLE_CALLBACK
          , o = r.ERR_TRANSFORM_ALREADY_TRANSFORMING
          , a = r.ERR_TRANSFORM_WITH_LENGTH_0
          , h = e("./_stream_duplex");
        function u(e, t) {
            var n = this._transformState;
            n.transforming = !1;
            var r = n.writecb;
            if (null === r)
                return this.emit("error", new s);
            n.writechunk = null,
            n.writecb = null,
            null != t && this.push(t),
            r(e);
            var i = this._readableState;
            i.reading = !1,
            (i.needReadable || i.length < i.highWaterMark) && this._read(i.highWaterMark)
        }
        function c(e) {
            if (!(this instanceof c))
                return new c(e);
            h.call(this, e),
            this._transformState = {
                afterTransform: u.bind(this),
                needTransform: !1,
                transforming: !1,
                writecb: null,
                writechunk: null,
                writeencoding: null
            },
            this._readableState.needReadable = !0,
            this._readableState.sync = !1,
            e && ("function" == typeof e.transform && (this._transform = e.transform),
            "function" == typeof e.flush && (this._flush = e.flush)),
            this.on("prefinish", l)
        }
        function l() {
            var e = this;
            "function" != typeof this._flush || this._readableState.destroyed ? d(this, null, null) : this._flush((function(t, n) {
                d(e, t, n)
            }
            ))
        }
        function d(e, t, n) {
            if (t)
                return e.emit("error", t);
            if (null != n && e.push(n),
            e._writableState.length)
                throw new a;
            if (e._transformState.transforming)
                throw new o;
            return e.push(null)
        }
        e("inherits")(c, h),
        c.prototype.push = function(e, t) {
            return this._transformState.needTransform = !1,
            h.prototype.push.call(this, e, t)
        }
        ,
        c.prototype._transform = function(e, t, n) {
            n(new i("_transform()"))
        }
        ,
        c.prototype._write = function(e, t, n) {
            var r = this._transformState;
            if (r.writecb = n,
            r.writechunk = e,
            r.writeencoding = t,
            !r.transforming) {
                var i = this._readableState;
                (r.needTransform || i.needReadable || i.length < i.highWaterMark) && this._read(i.highWaterMark)
            }
        }
        ,
        c.prototype._read = function(e) {
            var t = this._transformState;
            null === t.writechunk || t.transforming ? t.needTransform = !0 : (t.transforming = !0,
            this._transform(t.writechunk, t.writeencoding, t.afterTransform))
        }
        ,
        c.prototype._destroy = function(e, t) {
            h.prototype._destroy.call(this, e, (function(e) {
                t(e)
            }
            ))
        }
    }
    , {
        "../errors": 26,
        "./_stream_duplex": 27,
        inherits: 20
    }],
    31: [function(e, t, n) {
        (function(n, r) {
            (function() {
                "use strict";
                function i(e) {
                    var t = this;
                    this.next = null,
                    this.entry = null,
                    this.finish = function() {
                        !function(e, t, n) {
                            var r = e.entry;
                            e.entry = null;
                            for (; r; ) {
                                var i = r.callback;
                                t.pendingcb--,
                                i(n),
                                r = r.next
                            }
                            t.corkedRequestsFree.next = e
                        }(t, e)
                    }
                }
                var s;
                t.exports = R,
                R.WritableState = C;
                var o = {
                    deprecate: e("util-deprecate")
                }
                  , a = e("./internal/streams/stream")
                  , h = e("buffer").Buffer
                  , u = r.Uint8Array || function() {}
                ;
                var c, l = e("./internal/streams/destroy"), d = e("./internal/streams/state").getHighWaterMark, f = e("../errors").codes, p = f.ERR_INVALID_ARG_TYPE, g = f.ERR_METHOD_NOT_IMPLEMENTED, m = f.ERR_MULTIPLE_CALLBACK, y = f.ERR_STREAM_CANNOT_PIPE, b = f.ERR_STREAM_DESTROYED, _ = f.ERR_STREAM_NULL_VALUES, w = f.ERR_STREAM_WRITE_AFTER_END, v = f.ERR_UNKNOWN_ENCODING, S = l.errorOrDestroy;
                function E() {}
                function C(t, r, o) {
                    s = s || e("./_stream_duplex"),
                    t = t || {},
                    "boolean" != typeof o && (o = r instanceof s),
                    this.objectMode = !!t.objectMode,
                    o && (this.objectMode = this.objectMode || !!t.writableObjectMode),
                    this.highWaterMark = d(this, t, "writableHighWaterMark", o),
                    this.finalCalled = !1,
                    this.needDrain = !1,
                    this.ending = !1,
                    this.ended = !1,
                    this.finished = !1,
                    this.destroyed = !1;
                    var a = !1 === t.decodeStrings;
                    this.decodeStrings = !a,
                    this.defaultEncoding = t.defaultEncoding || "utf8",
                    this.length = 0,
                    this.writing = !1,
                    this.corked = 0,
                    this.sync = !0,
                    this.bufferProcessing = !1,
                    this.onwrite = function(e) {
                        !function(e, t) {
                            var r = e._writableState
                              , i = r.sync
                              , s = r.writecb;
                            if ("function" != typeof s)
                                throw new m;
                            if (function(e) {
                                e.writing = !1,
                                e.writecb = null,
                                e.length -= e.writelen,
                                e.writelen = 0
                            }(r),
                            t)
                                !function(e, t, r, i, s) {
                                    --t.pendingcb,
                                    r ? (n.nextTick(s, i),
                                    n.nextTick(O, e, t),
                                    e._writableState.errorEmitted = !0,
                                    S(e, i)) : (s(i),
                                    e._writableState.errorEmitted = !0,
                                    S(e, i),
                                    O(e, t))
                                }(e, r, i, t, s);
                            else {
                                var o = A(r) || e.destroyed;
                                o || r.corked || r.bufferProcessing || !r.bufferedRequest || M(e, r),
                                i ? n.nextTick(k, e, r, o, s) : k(e, r, o, s)
                            }
                        }(r, e)
                    }
                    ,
                    this.writecb = null,
                    this.writelen = 0,
                    this.bufferedRequest = null,
                    this.lastBufferedRequest = null,
                    this.pendingcb = 0,
                    this.prefinished = !1,
                    this.errorEmitted = !1,
                    this.emitClose = !1 !== t.emitClose,
                    this.autoDestroy = !!t.autoDestroy,
                    this.bufferedRequestCount = 0,
                    this.corkedRequestsFree = new i(this)
                }
                function R(t) {
                    var n = this instanceof (s = s || e("./_stream_duplex"));
                    if (!n && !c.call(R, this))
                        return new R(t);
                    this._writableState = new C(t,this,n),
                    this.writable = !0,
                    t && ("function" == typeof t.write && (this._write = t.write),
                    "function" == typeof t.writev && (this._writev = t.writev),
                    "function" == typeof t.destroy && (this._destroy = t.destroy),
                    "function" == typeof t.final && (this._final = t.final)),
                    a.call(this)
                }
                function T(e, t, n, r, i, s, o) {
                    t.writelen = r,
                    t.writecb = o,
                    t.writing = !0,
                    t.sync = !0,
                    t.destroyed ? t.onwrite(new b("write")) : n ? e._writev(i, t.onwrite) : e._write(i, s, t.onwrite),
                    t.sync = !1
                }
                function k(e, t, n, r) {
                    n || function(e, t) {
                        0 === t.length && t.needDrain && (t.needDrain = !1,
                        e.emit("drain"))
                    }(e, t),
                    t.pendingcb--,
                    r(),
                    O(e, t)
                }
                function M(e, t) {
                    t.bufferProcessing = !0;
                    var n = t.bufferedRequest;
                    if (e._writev && n && n.next) {
                        var r = t.bufferedRequestCount
                          , s = new Array(r)
                          , o = t.corkedRequestsFree;
                        o.entry = n;
                        for (var a = 0, h = !0; n; )
                            s[a] = n,
                            n.isBuf || (h = !1),
                            n = n.next,
                            a += 1;
                        s.allBuffers = h,
                        T(e, t, !0, t.length, s, "", o.finish),
                        t.pendingcb++,
                        t.lastBufferedRequest = null,
                        o.next ? (t.corkedRequestsFree = o.next,
                        o.next = null) : t.corkedRequestsFree = new i(t),
                        t.bufferedRequestCount = 0
                    } else {
                        for (; n; ) {
                            var u = n.chunk
                              , c = n.encoding
                              , l = n.callback;
                            if (T(e, t, !1, t.objectMode ? 1 : u.length, u, c, l),
                            n = n.next,
                            t.bufferedRequestCount--,
                            t.writing)
                                break
                        }
                        null === n && (t.lastBufferedRequest = null)
                    }
                    t.bufferedRequest = n,
                    t.bufferProcessing = !1
                }
                function A(e) {
                    return e.ending && 0 === e.length && null === e.bufferedRequest && !e.finished && !e.writing
                }
                function I(e, t) {
                    e._final((function(n) {
                        t.pendingcb--,
                        n && S(e, n),
                        t.prefinished = !0,
                        e.emit("prefinish"),
                        O(e, t)
                    }
                    ))
                }
                function O(e, t) {
                    var r = A(t);
                    if (r && (function(e, t) {
                        t.prefinished || t.finalCalled || ("function" != typeof e._final || t.destroyed ? (t.prefinished = !0,
                        e.emit("prefinish")) : (t.pendingcb++,
                        t.finalCalled = !0,
                        n.nextTick(I, e, t)))
                    }(e, t),
                    0 === t.pendingcb && (t.finished = !0,
                    e.emit("finish"),
                    t.autoDestroy))) {
                        var i = e._readableState;
                        (!i || i.autoDestroy && i.endEmitted) && e.destroy()
                    }
                    return r
                }
                e("inherits")(R, a),
                C.prototype.getBuffer = function() {
                    for (var e = this.bufferedRequest, t = []; e; )
                        t.push(e),
                        e = e.next;
                    return t
                }
                ,
                function() {
                    try {
                        Object.defineProperty(C.prototype, "buffer", {
                            get: o.deprecate((function() {
                                return this.getBuffer()
                            }
                            ), "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
                        })
                    } catch (e) {}
                }(),
                "function" == typeof Symbol && Symbol.hasInstance && "function" == typeof Function.prototype[Symbol.hasInstance] ? (c = Function.prototype[Symbol.hasInstance],
                Object.defineProperty(R, Symbol.hasInstance, {
                    value: function(e) {
                        return !!c.call(this, e) || this === R && (e && e._writableState instanceof C)
                    }
                })) : c = function(e) {
                    return e instanceof this
                }
                ,
                R.prototype.pipe = function() {
                    S(this, new y)
                }
                ,
                R.prototype.write = function(e, t, r) {
                    var i, s = this._writableState, o = !1, a = !s.objectMode && (i = e,
                    h.isBuffer(i) || i instanceof u);
                    return a && !h.isBuffer(e) && (e = function(e) {
                        return h.from(e)
                    }(e)),
                    "function" == typeof t && (r = t,
                    t = null),
                    a ? t = "buffer" : t || (t = s.defaultEncoding),
                    "function" != typeof r && (r = E),
                    s.ending ? function(e, t) {
                        var r = new w;
                        S(e, r),
                        n.nextTick(t, r)
                    }(this, r) : (a || function(e, t, r, i) {
                        var s;
                        return null === r ? s = new _ : "string" == typeof r || t.objectMode || (s = new p("chunk",["string", "Buffer"],r)),
                        !s || (S(e, s),
                        n.nextTick(i, s),
                        !1)
                    }(this, s, e, r)) && (s.pendingcb++,
                    o = function(e, t, n, r, i, s) {
                        if (!n) {
                            var o = function(e, t, n) {
                                e.objectMode || !1 === e.decodeStrings || "string" != typeof t || (t = h.from(t, n));
                                return t
                            }(t, r, i);
                            r !== o && (n = !0,
                            i = "buffer",
                            r = o)
                        }
                        var a = t.objectMode ? 1 : r.length;
                        t.length += a;
                        var u = t.length < t.highWaterMark;
                        u || (t.needDrain = !0);
                        if (t.writing || t.corked) {
                            var c = t.lastBufferedRequest;
                            t.lastBufferedRequest = {
                                chunk: r,
                                encoding: i,
                                isBuf: n,
                                callback: s,
                                next: null
                            },
                            c ? c.next = t.lastBufferedRequest : t.bufferedRequest = t.lastBufferedRequest,
                            t.bufferedRequestCount += 1
                        } else
                            T(e, t, !1, a, r, i, s);
                        return u
                    }(this, s, a, e, t, r)),
                    o
                }
                ,
                R.prototype.cork = function() {
                    this._writableState.corked++
                }
                ,
                R.prototype.uncork = function() {
                    var e = this._writableState;
                    e.corked && (e.corked--,
                    e.writing || e.corked || e.bufferProcessing || !e.bufferedRequest || M(this, e))
                }
                ,
                R.prototype.setDefaultEncoding = function(e) {
                    if ("string" == typeof e && (e = e.toLowerCase()),
                    !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((e + "").toLowerCase()) > -1))
                        throw new v(e);
                    return this._writableState.defaultEncoding = e,
                    this
                }
                ,
                Object.defineProperty(R.prototype, "writableBuffer", {
                    enumerable: !1,
                    get: function() {
                        return this._writableState && this._writableState.getBuffer()
                    }
                }),
                Object.defineProperty(R.prototype, "writableHighWaterMark", {
                    enumerable: !1,
                    get: function() {
                        return this._writableState.highWaterMark
                    }
                }),
                R.prototype._write = function(e, t, n) {
                    n(new g("_write()"))
                }
                ,
                R.prototype._writev = null,
                R.prototype.end = function(e, t, r) {
                    var i = this._writableState;
                    return "function" == typeof e ? (r = e,
                    e = null,
                    t = null) : "function" == typeof t && (r = t,
                    t = null),
                    null != e && this.write(e, t),
                    i.corked && (i.corked = 1,
                    this.uncork()),
                    i.ending || function(e, t, r) {
                        t.ending = !0,
                        O(e, t),
                        r && (t.finished ? n.nextTick(r) : e.once("finish", r));
                        t.ended = !0,
                        e.writable = !1
                    }(this, i, r),
                    this
                }
                ,
                Object.defineProperty(R.prototype, "writableLength", {
                    enumerable: !1,
                    get: function() {
                        return this._writableState.length
                    }
                }),
                Object.defineProperty(R.prototype, "destroyed", {
                    enumerable: !1,
                    get: function() {
                        return void 0 !== this._writableState && this._writableState.destroyed
                    },
                    set: function(e) {
                        this._writableState && (this._writableState.destroyed = e)
                    }
                }),
                R.prototype.destroy = l.destroy,
                R.prototype._undestroy = l.undestroy,
                R.prototype._destroy = function(e, t) {
                    t(e)
                }
            }
            ).call(this)
        }
        ).call(this, e("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }
    , {
        "../errors": 26,
        "./_stream_duplex": 27,
        "./internal/streams/destroy": 34,
        "./internal/streams/state": 38,
        "./internal/streams/stream": 39,
        _process: 23,
        buffer: "buffer",
        inherits: 20,
        "util-deprecate": 48
    }],
    32: [function(e, t, n) {
        (function(n) {
            (function() {
                "use strict";
                var r;
                function i(e, t, n) {
                    return t in e ? Object.defineProperty(e, t, {
                        value: n,
                        enumerable: !0,
                        configurable: !0,
                        writable: !0
                    }) : e[t] = n,
                    e
                }
                var s = e("./end-of-stream")
                  , o = Symbol("lastResolve")
                  , a = Symbol("lastReject")
                  , h = Symbol("error")
                  , u = Symbol("ended")
                  , c = Symbol("lastPromise")
                  , l = Symbol("handlePromise")
                  , d = Symbol("stream");
                function f(e, t) {
                    return {
                        value: e,
                        done: t
                    }
                }
                function p(e) {
                    var t = e[o];
                    if (null !== t) {
                        var n = e[d].read();
                        null !== n && (e[c] = null,
                        e[o] = null,
                        e[a] = null,
                        t(f(n, !1)))
                    }
                }
                function g(e) {
                    n.nextTick(p, e)
                }
                var m = Object.getPrototypeOf((function() {}
                ))
                  , y = Object.setPrototypeOf((i(r = {
                    get stream() {
                        return this[d]
                    },
                    next: function() {
                        var e = this
                          , t = this[h];
                        if (null !== t)
                            return Promise.reject(t);
                        if (this[u])
                            return Promise.resolve(f(void 0, !0));
                        if (this[d].destroyed)
                            return new Promise((function(t, r) {
                                n.nextTick((function() {
                                    e[h] ? r(e[h]) : t(f(void 0, !0))
                                }
                                ))
                            }
                            ));
                        var r, i = this[c];
                        if (i)
                            r = new Promise(function(e, t) {
                                return function(n, r) {
                                    e.then((function() {
                                        t[u] ? n(f(void 0, !0)) : t[l](n, r)
                                    }
                                    ), r)
                                }
                            }(i, this));
                        else {
                            var s = this[d].read();
                            if (null !== s)
                                return Promise.resolve(f(s, !1));
                            r = new Promise(this[l])
                        }
                        return this[c] = r,
                        r
                    }
                }, Symbol.asyncIterator, (function() {
                    return this
                }
                )),
                i(r, "return", (function() {
                    var e = this;
                    return new Promise((function(t, n) {
                        e[d].destroy(null, (function(e) {
                            e ? n(e) : t(f(void 0, !0))
                        }
                        ))
                    }
                    ))
                }
                )),
                r), m);
                t.exports = function(e) {
                    var t, n = Object.create(y, (i(t = {}, d, {
                        value: e,
                        writable: !0
                    }),
                    i(t, o, {
                        value: null,
                        writable: !0
                    }),
                    i(t, a, {
                        value: null,
                        writable: !0
                    }),
                    i(t, h, {
                        value: null,
                        writable: !0
                    }),
                    i(t, u, {
                        value: e._readableState.endEmitted,
                        writable: !0
                    }),
                    i(t, l, {
                        value: function(e, t) {
                            var r = n[d].read();
                            r ? (n[c] = null,
                            n[o] = null,
                            n[a] = null,
                            e(f(r, !1))) : (n[o] = e,
                            n[a] = t)
                        },
                        writable: !0
                    }),
                    t));
                    return n[c] = null,
                    s(e, (function(e) {
                        if (e && "ERR_STREAM_PREMATURE_CLOSE" !== e.code) {
                            var t = n[a];
                            return null !== t && (n[c] = null,
                            n[o] = null,
                            n[a] = null,
                            t(e)),
                            void (n[h] = e)
                        }
                        var r = n[o];
                        null !== r && (n[c] = null,
                        n[o] = null,
                        n[a] = null,
                        r(f(void 0, !0))),
                        n[u] = !0
                    }
                    )),
                    e.on("readable", g.bind(null, n)),
                    n
                }
            }
            ).call(this)
        }
        ).call(this, e("_process"))
    }
    , {
        "./end-of-stream": 35,
        _process: 23
    }],
    33: [function(e, t, n) {
        "use strict";
        function r(e, t) {
            var n = Object.keys(e);
            if (Object.getOwnPropertySymbols) {
                var r = Object.getOwnPropertySymbols(e);
                t && (r = r.filter((function(t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable
                }
                ))),
                n.push.apply(n, r)
            }
            return n
        }
        function i(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n,
            e
        }
        function s(e, t) {
            for (var n = 0; n < t.length; n++) {
                var r = t[n];
                r.enumerable = r.enumerable || !1,
                r.configurable = !0,
                "value"in r && (r.writable = !0),
                Object.defineProperty(e, r.key, r)
            }
        }
        var o = e("buffer").Buffer
          , a = e("util").inspect
          , h = a && a.custom || "inspect";
        t.exports = function() {
            function e() {
                !function(e, t) {
                    if (!(e instanceof t))
                        throw new TypeError("Cannot call a class as a function")
                }(this, e),
                this.head = null,
                this.tail = null,
                this.length = 0
            }
            var t, n, u;
            return t = e,
            (n = [{
                key: "push",
                value: function(e) {
                    var t = {
                        data: e,
                        next: null
                    };
                    this.length > 0 ? this.tail.next = t : this.head = t,
                    this.tail = t,
                    ++this.length
                }
            }, {
                key: "unshift",
                value: function(e) {
                    var t = {
                        data: e,
                        next: this.head
                    };
                    0 === this.length && (this.tail = t),
                    this.head = t,
                    ++this.length
                }
            }, {
                key: "shift",
                value: function() {
                    if (0 !== this.length) {
                        var e = this.head.data;
                        return 1 === this.length ? this.head = this.tail = null : this.head = this.head.next,
                        --this.length,
                        e
                    }
                }
            }, {
                key: "clear",
                value: function() {
                    this.head = this.tail = null,
                    this.length = 0
                }
            }, {
                key: "join",
                value: function(e) {
                    if (0 === this.length)
                        return "";
                    for (var t = this.head, n = "" + t.data; t = t.next; )
                        n += e + t.data;
                    return n
                }
            }, {
                key: "concat",
                value: function(e) {
                    if (0 === this.length)
                        return o.alloc(0);
                    for (var t, n, r, i = o.allocUnsafe(e >>> 0), s = this.head, a = 0; s; )
                        t = s.data,
                        n = i,
                        r = a,
                        o.prototype.copy.call(t, n, r),
                        a += s.data.length,
                        s = s.next;
                    return i
                }
            }, {
                key: "consume",
                value: function(e, t) {
                    var n;
                    return e < this.head.data.length ? (n = this.head.data.slice(0, e),
                    this.head.data = this.head.data.slice(e)) : n = e === this.head.data.length ? this.shift() : t ? this._getString(e) : this._getBuffer(e),
                    n
                }
            }, {
                key: "first",
                value: function() {
                    return this.head.data
                }
            }, {
                key: "_getString",
                value: function(e) {
                    var t = this.head
                      , n = 1
                      , r = t.data;
                    for (e -= r.length; t = t.next; ) {
                        var i = t.data
                          , s = e > i.length ? i.length : e;
                        if (s === i.length ? r += i : r += i.slice(0, e),
                        0 == (e -= s)) {
                            s === i.length ? (++n,
                            t.next ? this.head = t.next : this.head = this.tail = null) : (this.head = t,
                            t.data = i.slice(s));
                            break
                        }
                        ++n
                    }
                    return this.length -= n,
                    r
                }
            }, {
                key: "_getBuffer",
                value: function(e) {
                    var t = o.allocUnsafe(e)
                      , n = this.head
                      , r = 1;
                    for (n.data.copy(t),
                    e -= n.data.length; n = n.next; ) {
                        var i = n.data
                          , s = e > i.length ? i.length : e;
                        if (i.copy(t, t.length - e, 0, s),
                        0 == (e -= s)) {
                            s === i.length ? (++r,
                            n.next ? this.head = n.next : this.head = this.tail = null) : (this.head = n,
                            n.data = i.slice(s));
                            break
                        }
                        ++r
                    }
                    return this.length -= r,
                    t
                }
            }, {
                key: h,
                value: function(e, t) {
                    return a(this, function(e) {
                        for (var t = 1; t < arguments.length; t++) {
                            var n = null != arguments[t] ? arguments[t] : {};
                            t % 2 ? r(Object(n), !0).forEach((function(t) {
                                i(e, t, n[t])
                            }
                            )) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : r(Object(n)).forEach((function(t) {
                                Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t))
                            }
                            ))
                        }
                        return e
                    }({}, t, {
                        depth: 0,
                        customInspect: !1
                    }))
                }
            }]) && s(t.prototype, n),
            u && s(t, u),
            e
        }()
    }
    , {
        buffer: "buffer",
        util: 15
    }],
    34: [function(e, t, n) {
        (function(e) {
            (function() {
                "use strict";
                function n(e, t) {
                    i(e, t),
                    r(e)
                }
                function r(e) {
                    e._writableState && !e._writableState.emitClose || e._readableState && !e._readableState.emitClose || e.emit("close")
                }
                function i(e, t) {
                    e.emit("error", t)
                }
                t.exports = {
                    destroy: function(t, s) {
                        var o = this
                          , a = this._readableState && this._readableState.destroyed
                          , h = this._writableState && this._writableState.destroyed;
                        return a || h ? (s ? s(t) : t && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0,
                        e.nextTick(i, this, t)) : e.nextTick(i, this, t)),
                        this) : (this._readableState && (this._readableState.destroyed = !0),
                        this._writableState && (this._writableState.destroyed = !0),
                        this._destroy(t || null, (function(t) {
                            !s && t ? o._writableState ? o._writableState.errorEmitted ? e.nextTick(r, o) : (o._writableState.errorEmitted = !0,
                            e.nextTick(n, o, t)) : e.nextTick(n, o, t) : s ? (e.nextTick(r, o),
                            s(t)) : e.nextTick(r, o)
                        }
                        )),
                        this)
                    },
                    undestroy: function() {
                        this._readableState && (this._readableState.destroyed = !1,
                        this._readableState.reading = !1,
                        this._readableState.ended = !1,
                        this._readableState.endEmitted = !1),
                        this._writableState && (this._writableState.destroyed = !1,
                        this._writableState.ended = !1,
                        this._writableState.ending = !1,
                        this._writableState.finalCalled = !1,
                        this._writableState.prefinished = !1,
                        this._writableState.finished = !1,
                        this._writableState.errorEmitted = !1)
                    },
                    errorOrDestroy: function(e, t) {
                        var n = e._readableState
                          , r = e._writableState;
                        n && n.autoDestroy || r && r.autoDestroy ? e.destroy(t) : e.emit("error", t)
                    }
                }
            }
            ).call(this)
        }
        ).call(this, e("_process"))
    }
    , {
        _process: 23
    }],
    35: [function(e, t, n) {
        "use strict";
        var r = e("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;
        function i() {}
        t.exports = function e(t, n, s) {
            if ("function" == typeof n)
                return e(t, null, n);
            n || (n = {}),
            s = function(e) {
                var t = !1;
                return function() {
                    if (!t) {
                        t = !0;
                        for (var n = arguments.length, r = new Array(n), i = 0; i < n; i++)
                            r[i] = arguments[i];
                        e.apply(this, r)
                    }
                }
            }(s || i);
            var o = n.readable || !1 !== n.readable && t.readable
              , a = n.writable || !1 !== n.writable && t.writable
              , h = function() {
                t.writable || c()
            }
              , u = t._writableState && t._writableState.finished
              , c = function() {
                a = !1,
                u = !0,
                o || s.call(t)
            }
              , l = t._readableState && t._readableState.endEmitted
              , d = function() {
                o = !1,
                l = !0,
                a || s.call(t)
            }
              , f = function(e) {
                s.call(t, e)
            }
              , p = function() {
                var e;
                return o && !l ? (t._readableState && t._readableState.ended || (e = new r),
                s.call(t, e)) : a && !u ? (t._writableState && t._writableState.ended || (e = new r),
                s.call(t, e)) : void 0
            }
              , g = function() {
                t.req.on("finish", c)
            };
            return !function(e) {
                return e.setHeader && "function" == typeof e.abort
            }(t) ? a && !t._writableState && (t.on("end", h),
            t.on("close", h)) : (t.on("complete", c),
            t.on("abort", p),
            t.req ? g() : t.on("request", g)),
            t.on("end", d),
            t.on("finish", c),
            !1 !== n.error && t.on("error", f),
            t.on("close", p),
            function() {
                t.removeListener("complete", c),
                t.removeListener("abort", p),
                t.removeListener("request", g),
                t.req && t.req.removeListener("finish", c),
                t.removeListener("end", h),
                t.removeListener("close", h),
                t.removeListener("finish", c),
                t.removeListener("end", d),
                t.removeListener("error", f),
                t.removeListener("close", p)
            }
        }
    }
    , {
        "../../../errors": 26
    }],
    36: [function(e, t, n) {
        t.exports = function() {
            throw new Error("Readable.from is not available in the browser")
        }
    }
    , {}],
    37: [function(e, t, n) {
        "use strict";
        var r;
        var i = e("../../../errors").codes
          , s = i.ERR_MISSING_ARGS
          , o = i.ERR_STREAM_DESTROYED;
        function a(e) {
            if (e)
                throw e
        }
        function h(t, n, i, s) {
            s = function(e) {
                var t = !1;
                return function() {
                    t || (t = !0,
                    e.apply(void 0, arguments))
                }
            }(s);
            var a = !1;
            t.on("close", (function() {
                a = !0
            }
            )),
            void 0 === r && (r = e("./end-of-stream")),
            r(t, {
                readable: n,
                writable: i
            }, (function(e) {
                if (e)
                    return s(e);
                a = !0,
                s()
            }
            ));
            var h = !1;
            return function(e) {
                if (!a && !h)
                    return h = !0,
                    function(e) {
                        return e.setHeader && "function" == typeof e.abort
                    }(t) ? t.abort() : "function" == typeof t.destroy ? t.destroy() : void s(e || new o("pipe"))
            }
        }
        function u(e) {
            e()
        }
        function c(e, t) {
            return e.pipe(t)
        }
        function l(e) {
            return e.length ? "function" != typeof e[e.length - 1] ? a : e.pop() : a
        }
        t.exports = function() {
            for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
                t[n] = arguments[n];
            var r, i = l(t);
            if (Array.isArray(t[0]) && (t = t[0]),
            t.length < 2)
                throw new s("streams");
            var o = t.map((function(e, n) {
                var s = n < t.length - 1;
                return h(e, s, n > 0, (function(e) {
                    r || (r = e),
                    e && o.forEach(u),
                    s || (o.forEach(u),
                    i(r))
                }
                ))
            }
            ));
            return t.reduce(c)
        }
    }
    , {
        "../../../errors": 26,
        "./end-of-stream": 35
    }],
    38: [function(e, t, n) {
        "use strict";
        var r = e("../../../errors").codes.ERR_INVALID_OPT_VALUE;
        t.exports = {
            getHighWaterMark: function(e, t, n, i) {
                var s = function(e, t, n) {
                    return null != e.highWaterMark ? e.highWaterMark : t ? e[n] : null
                }(t, i, n);
                if (null != s) {
                    if (!isFinite(s) || Math.floor(s) !== s || s < 0)
                        throw new r(i ? n : "highWaterMark",s);
                    return Math.floor(s)
                }
                return e.objectMode ? 16 : 16384
            }
        }
    }
    , {
        "../../../errors": 26
    }],
    39: [function(e, t, n) {
        t.exports = e("events").EventEmitter
    }
    , {
        events: "events"
    }],
    40: [function(e, t, n) {
        (n = t.exports = e("./lib/_stream_readable.js")).Stream = n,
        n.Readable = n,
        n.Writable = e("./lib/_stream_writable.js"),
        n.Duplex = e("./lib/_stream_duplex.js"),
        n.Transform = e("./lib/_stream_transform.js"),
        n.PassThrough = e("./lib/_stream_passthrough.js"),
        n.finished = e("./lib/internal/streams/end-of-stream.js"),
        n.pipeline = e("./lib/internal/streams/pipeline.js")
    }
    , {
        "./lib/_stream_duplex.js": 27,
        "./lib/_stream_passthrough.js": 28,
        "./lib/_stream_readable.js": 29,
        "./lib/_stream_transform.js": 30,
        "./lib/_stream_writable.js": 31,
        "./lib/internal/streams/end-of-stream.js": 35,
        "./lib/internal/streams/pipeline.js": 37
    }],
    41: [function(e, t, n) {
        t.exports = function(e, t) {
            let n, i, s, o = !0;
            Array.isArray(e) ? (n = [],
            i = e.length) : (s = Object.keys(e),
            n = {},
            i = s.length);
            function a(e) {
                function i() {
                    t && t(e, n),
                    t = null
                }
                o ? r(i) : i()
            }
            function h(e, t, r) {
                n[e] = r,
                (0 == --i || t) && a(t)
            }
            i ? s ? s.forEach((function(t) {
                e[t]((function(e, n) {
                    h(t, e, n)
                }
                ))
            }
            )) : e.forEach((function(e, t) {
                e((function(e, n) {
                    h(t, e, n)
                }
                ))
            }
            )) : a(null);
            o = !1
        }
        ;
        const r = e("queue-microtask")
    }
    , {
        "queue-microtask": 24
    }],
    42: [function(e, t, n) {
        var r = e("buffer")
          , i = r.Buffer;
        function s(e, t) {
            for (var n in e)
                t[n] = e[n]
        }
        function o(e, t, n) {
            return i(e, t, n)
        }
        i.from && i.alloc && i.allocUnsafe && i.allocUnsafeSlow ? t.exports = r : (s(r, n),
        n.Buffer = o),
        o.prototype = Object.create(i.prototype),
        s(i, o),
        o.from = function(e, t, n) {
            if ("number" == typeof e)
                throw new TypeError("Argument must not be a number");
            return i(e, t, n)
        }
        ,
        o.alloc = function(e, t, n) {
            if ("number" != typeof e)
                throw new TypeError("Argument must be a number");
            var r = i(e);
            return void 0 !== t ? "string" == typeof n ? r.fill(t, n) : r.fill(t) : r.fill(0),
            r
        }
        ,
        o.allocUnsafe = function(e) {
            if ("number" != typeof e)
                throw new TypeError("Argument must be a number");
            return i(e)
        }
        ,
        o.allocUnsafeSlow = function(e) {
            if ("number" != typeof e)
                throw new TypeError("Argument must be a number");
            return r.SlowBuffer(e)
        }
    }
    , {
        buffer: "buffer"
    }],
    43: [function(e, t, n) {
        var r = e("safe-buffer").Buffer;
        function i(e, t) {
            this._block = r.alloc(e),
            this._finalSize = t,
            this._blockSize = e,
            this._len = 0
        }
        i.prototype.update = function(e, t) {
            "string" == typeof e && (t = t || "utf8",
            e = r.from(e, t));
            for (var n = this._block, i = this._blockSize, s = e.length, o = this._len, a = 0; a < s; ) {
                for (var h = o % i, u = Math.min(s - a, i - h), c = 0; c < u; c++)
                    n[h + c] = e[a + c];
                a += u,
                (o += u) % i == 0 && this._update(n)
            }
            return this._len += s,
            this
        }
        ,
        i.prototype.digest = function(e) {
            var t = this._len % this._blockSize;
            this._block[t] = 128,
            this._block.fill(0, t + 1),
            t >= this._finalSize && (this._update(this._block),
            this._block.fill(0));
            var n = 8 * this._len;
            if (n <= 4294967295)
                this._block.writeUInt32BE(n, this._blockSize - 4);
            else {
                var r = (4294967295 & n) >>> 0
                  , i = (n - r) / 4294967296;
                this._block.writeUInt32BE(i, this._blockSize - 8),
                this._block.writeUInt32BE(r, this._blockSize - 4)
            }
            this._update(this._block);
            var s = this._hash();
            return e ? s.toString(e) : s
        }
        ,
        i.prototype._update = function() {
            throw new Error("_update must be implemented by subclass")
        }
        ,
        t.exports = i
    }
    , {
        "safe-buffer": 42
    }],
    44: [function(e, t, n) {
        var r = e("inherits")
          , i = e("./hash")
          , s = e("safe-buffer").Buffer
          , o = [1518500249, 1859775393, -1894007588, -899497514]
          , a = new Array(80);
        function h() {
            this.init(),
            this._w = a,
            i.call(this, 64, 56)
        }
        function u(e) {
            return e << 5 | e >>> 27
        }
        function c(e) {
            return e << 30 | e >>> 2
        }
        function l(e, t, n, r) {
            return 0 === e ? t & n | ~t & r : 2 === e ? t & n | t & r | n & r : t ^ n ^ r
        }
        r(h, i),
        h.prototype.init = function() {
            return this._a = 1732584193,
            this._b = 4023233417,
            this._c = 2562383102,
            this._d = 271733878,
            this._e = 3285377520,
            this
        }
        ,
        h.prototype._update = function(e) {
            for (var t, n = this._w, r = 0 | this._a, i = 0 | this._b, s = 0 | this._c, a = 0 | this._d, h = 0 | this._e, d = 0; d < 16; ++d)
                n[d] = e.readInt32BE(4 * d);
            for (; d < 80; ++d)
                n[d] = (t = n[d - 3] ^ n[d - 8] ^ n[d - 14] ^ n[d - 16]) << 1 | t >>> 31;
            for (var f = 0; f < 80; ++f) {
                var p = ~~(f / 20)
                  , g = u(r) + l(p, i, s, a) + h + n[f] + o[p] | 0;
                h = a,
                a = s,
                s = c(i),
                i = r,
                r = g
            }
            this._a = r + this._a | 0,
            this._b = i + this._b | 0,
            this._c = s + this._c | 0,
            this._d = a + this._d | 0,
            this._e = h + this._e | 0
        }
        ,
        h.prototype._hash = function() {
            var e = s.allocUnsafe(20);
            return e.writeInt32BE(0 | this._a, 0),
            e.writeInt32BE(0 | this._b, 4),
            e.writeInt32BE(0 | this._c, 8),
            e.writeInt32BE(0 | this._d, 12),
            e.writeInt32BE(0 | this._e, 16),
            e
        }
        ,
        t.exports = h
    }
    , {
        "./hash": 43,
        inherits: 20,
        "safe-buffer": 42
    }],
    45: [function(e, t, n) {
        const r = e("debug")("simple-peer")
          , i = e("get-browser-rtc")
          , s = e("randombytes")
          , o = e("readable-stream")
          , a = e("queue-microtask")
          , h = e("err-code")
          , {Buffer: u} = e("buffer")
          , c = 65536;
        function l(e) {
            return e.replace(/a=ice-options:trickle\s\n/g, "")
        }
        class d extends o.Duplex {
            constructor(e) {
                if (super(e = Object.assign({
                    allowHalfOpen: !1
                }, e)),
                this._id = s(4).toString("hex").slice(0, 7),
                this._debug("new peer %o", e),
                this.channelName = e.initiator ? e.channelName || s(20).toString("hex") : null,
                this.initiator = e.initiator || !1,
                this.channelConfig = e.channelConfig || d.channelConfig,
                this.channelNegotiated = this.channelConfig.negotiated,
                this.config = Object.assign({}, d.config, e.config),
                this.offerOptions = e.offerOptions || {},
                this.answerOptions = e.answerOptions || {},
                this.sdpTransform = e.sdpTransform || (e=>e),
                this.streams = e.streams || (e.stream ? [e.stream] : []),
                this.trickle = void 0 === e.trickle || e.trickle,
                this.allowHalfTrickle = void 0 !== e.allowHalfTrickle && e.allowHalfTrickle,
                this.iceCompleteTimeout = e.iceCompleteTimeout || 5e3,
                this.destroyed = !1,
                this.destroying = !1,
                this._connected = !1,
                this.remoteAddress = void 0,
                this.remoteFamily = void 0,
                this.remotePort = void 0,
                this.localAddress = void 0,
                this.localFamily = void 0,
                this.localPort = void 0,
                this._wrtc = e.wrtc && "object" == typeof e.wrtc ? e.wrtc : i(),
                !this._wrtc)
                    throw "undefined" == typeof window ? h(new Error("No WebRTC support: Specify `opts.wrtc` option in this environment"), "ERR_WEBRTC_SUPPORT") : h(new Error("No WebRTC support: Not a supported browser"), "ERR_WEBRTC_SUPPORT");
                this._pcReady = !1,
                this._channelReady = !1,
                this._iceComplete = !1,
                this._iceCompleteTimer = null,
                this._channel = null,
                this._pendingCandidates = [],
                this._isNegotiating = !1,
                this._firstNegotiation = !0,
                this._batchedNegotiation = !1,
                this._queuedNegotiation = !1,
                this._sendersAwaitingStable = [],
                this._senderMap = new Map,
                this._closingInterval = null,
                this._remoteTracks = [],
                this._remoteStreams = [],
                this._chunk = null,
                this._cb = null,
                this._interval = null;
                try {
                    this._pc = new this._wrtc.RTCPeerConnection(this.config)
                } catch (e) {
                    return void this.destroy(h(e, "ERR_PC_CONSTRUCTOR"))
                }
                this._isReactNativeWebrtc = "number" == typeof this._pc._peerConnectionId,
                this._pc.oniceconnectionstatechange = ()=>{
                    this._onIceStateChange()
                }
                ,
                this._pc.onicegatheringstatechange = ()=>{
                    this._onIceStateChange()
                }
                ,
                this._pc.onconnectionstatechange = ()=>{
                    this._onConnectionStateChange()
                }
                ,
                this._pc.onsignalingstatechange = ()=>{
                    this._onSignalingStateChange()
                }
                ,
                this._pc.onicecandidate = e=>{
                    this._onIceCandidate(e)
                }
                ,
                "object" == typeof this._pc.peerIdentity && this._pc.peerIdentity.catch((e=>{
                    this.destroy(h(e, "ERR_PC_PEER_IDENTITY"))
                }
                )),
                this.initiator || this.channelNegotiated ? this._setupData({
                    channel: this._pc.createDataChannel(this.channelName, this.channelConfig)
                }) : this._pc.ondatachannel = e=>{
                    this._setupData(e)
                }
                ,
                this.streams && this.streams.forEach((e=>{
                    this.addStream(e)
                }
                )),
                this._pc.ontrack = e=>{
                    this._onTrack(e)
                }
                ,
                this._debug("initial negotiation"),
                this._needsNegotiation(),
                this._onFinishBound = ()=>{
                    this._onFinish()
                }
                ,
                this.once("finish", this._onFinishBound)
            }
            get bufferSize() {
                return this._channel && this._channel.bufferedAmount || 0
            }
            get connected() {
                return this._connected && "open" === this._channel.readyState
            }
            address() {
                return {
                    port: this.localPort,
                    family: this.localFamily,
                    address: this.localAddress
                }
            }
            signal(e) {
                if (!this.destroying) {
                    if (this.destroyed)
                        throw h(new Error("cannot signal after peer is destroyed"), "ERR_DESTROYED");
                    if ("string" == typeof e)
                        try {
                            e = JSON.parse(e)
                        } catch (t) {
                            e = {}
                        }
                    this._debug("signal()"),
                    e.renegotiate && this.initiator && (this._debug("got request to renegotiate"),
                    this._needsNegotiation()),
                    e.transceiverRequest && this.initiator && (this._debug("got request for transceiver"),
                    this.addTransceiver(e.transceiverRequest.kind, e.transceiverRequest.init)),
                    e.candidate && (this._pc.remoteDescription && this._pc.remoteDescription.type ? this._addIceCandidate(e.candidate) : this._pendingCandidates.push(e.candidate)),
                    e.sdp && this._pc.setRemoteDescription(new this._wrtc.RTCSessionDescription(e)).then((()=>{
                        this.destroyed || (this._pendingCandidates.forEach((e=>{
                            this._addIceCandidate(e)
                        }
                        )),
                        this._pendingCandidates = [],
                        "offer" === this._pc.remoteDescription.type && this._createAnswer())
                    }
                    )).catch((e=>{
                        this.destroy(h(e, "ERR_SET_REMOTE_DESCRIPTION"))
                    }
                    )),
                    e.sdp || e.candidate || e.renegotiate || e.transceiverRequest || this.destroy(h(new Error("signal() called with invalid signal data"), "ERR_SIGNALING"))
                }
            }
            _addIceCandidate(e) {
                const t = new this._wrtc.RTCIceCandidate(e);
                this._pc.addIceCandidate(t).catch((e=>{
                    var n;
                    !t.address || t.address.endsWith(".local") ? (n = "Ignoring unsupported ICE candidate.",
                    console.warn(n)) : this.destroy(h(e, "ERR_ADD_ICE_CANDIDATE"))
                }
                ))
            }
            send(e) {
                if (!this.destroying) {
                    if (this.destroyed)
                        throw h(new Error("cannot send after peer is destroyed"), "ERR_DESTROYED");
                    this._channel.send(e)
                }
            }
            addTransceiver(e, t) {
                if (!this.destroying) {
                    if (this.destroyed)
                        throw h(new Error("cannot addTransceiver after peer is destroyed"), "ERR_DESTROYED");
                    if (this._debug("addTransceiver()"),
                    this.initiator)
                        try {
                            this._pc.addTransceiver(e, t),
                            this._needsNegotiation()
                        } catch (e) {
                            this.destroy(h(e, "ERR_ADD_TRANSCEIVER"))
                        }
                    else
                        this.emit("signal", {
                            type: "transceiverRequest",
                            transceiverRequest: {
                                kind: e,
                                init: t
                            }
                        })
                }
            }
            addStream(e) {
                if (!this.destroying) {
                    if (this.destroyed)
                        throw h(new Error("cannot addStream after peer is destroyed"), "ERR_DESTROYED");
                    this._debug("addStream()"),
                    e.getTracks().forEach((t=>{
                        this.addTrack(t, e)
                    }
                    ))
                }
            }
            addTrack(e, t) {
                if (this.destroying)
                    return;
                if (this.destroyed)
                    throw h(new Error("cannot addTrack after peer is destroyed"), "ERR_DESTROYED");
                this._debug("addTrack()");
                const n = this._senderMap.get(e) || new Map;
                let r = n.get(t);
                if (r)
                    throw r.removed ? h(new Error("Track has been removed. You should enable/disable tracks that you want to re-add."), "ERR_SENDER_REMOVED") : h(new Error("Track has already been added to that stream."), "ERR_SENDER_ALREADY_ADDED");
                r = this._pc.addTrack(e, t),
                n.set(t, r),
                this._senderMap.set(e, n),
                this._needsNegotiation()
            }
            replaceTrack(e, t, n) {
                if (this.destroying)
                    return;
                if (this.destroyed)
                    throw h(new Error("cannot replaceTrack after peer is destroyed"), "ERR_DESTROYED");
                this._debug("replaceTrack()");
                const r = this._senderMap.get(e)
                  , i = r ? r.get(n) : null;
                if (!i)
                    throw h(new Error("Cannot replace track that was never added."), "ERR_TRACK_NOT_ADDED");
                t && this._senderMap.set(t, r),
                null != i.replaceTrack ? i.replaceTrack(t) : this.destroy(h(new Error("replaceTrack is not supported in this browser"), "ERR_UNSUPPORTED_REPLACETRACK"))
            }
            removeTrack(e, t) {
                if (this.destroying)
                    return;
                if (this.destroyed)
                    throw h(new Error("cannot removeTrack after peer is destroyed"), "ERR_DESTROYED");
                this._debug("removeSender()");
                const n = this._senderMap.get(e)
                  , r = n ? n.get(t) : null;
                if (!r)
                    throw h(new Error("Cannot remove track that was never added."), "ERR_TRACK_NOT_ADDED");
                try {
                    r.removed = !0,
                    this._pc.removeTrack(r)
                } catch (e) {
                    "NS_ERROR_UNEXPECTED" === e.name ? this._sendersAwaitingStable.push(r) : this.destroy(h(e, "ERR_REMOVE_TRACK"))
                }
                this._needsNegotiation()
            }
            removeStream(e) {
                if (!this.destroying) {
                    if (this.destroyed)
                        throw h(new Error("cannot removeStream after peer is destroyed"), "ERR_DESTROYED");
                    this._debug("removeSenders()"),
                    e.getTracks().forEach((t=>{
                        this.removeTrack(t, e)
                    }
                    ))
                }
            }
            _needsNegotiation() {
                this._debug("_needsNegotiation"),
                this._batchedNegotiation || (this._batchedNegotiation = !0,
                a((()=>{
                    this._batchedNegotiation = !1,
                    this.initiator || !this._firstNegotiation ? (this._debug("starting batched negotiation"),
                    this.negotiate()) : this._debug("non-initiator initial negotiation request discarded"),
                    this._firstNegotiation = !1
                }
                )))
            }
            negotiate() {
                if (!this.destroying) {
                    if (this.destroyed)
                        throw h(new Error("cannot negotiate after peer is destroyed"), "ERR_DESTROYED");
                    this.initiator ? this._isNegotiating ? (this._queuedNegotiation = !0,
                    this._debug("already negotiating, queueing")) : (this._debug("start negotiation"),
                    setTimeout((()=>{
                        this._createOffer()
                    }
                    ), 0)) : this._isNegotiating ? (this._queuedNegotiation = !0,
                    this._debug("already negotiating, queueing")) : (this._debug("requesting negotiation from initiator"),
                    this.emit("signal", {
                        type: "renegotiate",
                        renegotiate: !0
                    })),
                    this._isNegotiating = !0
                }
            }
            destroy(e) {
                this._destroy(e, (()=>{}
                ))
            }
            _destroy(e, t) {
                this.destroyed || this.destroying || (this.destroying = !0,
                this._debug("destroying (error: %s)", e && (e.message || e)),
                a((()=>{
                    if (this.destroyed = !0,
                    this.destroying = !1,
                    this._debug("destroy (error: %s)", e && (e.message || e)),
                    this.readable = this.writable = !1,
                    this._readableState.ended || this.push(null),
                    this._writableState.finished || this.end(),
                    this._connected = !1,
                    this._pcReady = !1,
                    this._channelReady = !1,
                    this._remoteTracks = null,
                    this._remoteStreams = null,
                    this._senderMap = null,
                    clearInterval(this._closingInterval),
                    this._closingInterval = null,
                    clearInterval(this._interval),
                    this._interval = null,
                    this._chunk = null,
                    this._cb = null,
                    this._onFinishBound && this.removeListener("finish", this._onFinishBound),
                    this._onFinishBound = null,
                    this._channel) {
                        try {
                            this._channel.close()
                        } catch (e) {}
                        this._channel.onmessage = null,
                        this._channel.onopen = null,
                        this._channel.onclose = null,
                        this._channel.onerror = null
                    }
                    if (this._pc) {
                        try {
                            this._pc.close()
                        } catch (e) {}
                        this._pc.oniceconnectionstatechange = null,
                        this._pc.onicegatheringstatechange = null,
                        this._pc.onsignalingstatechange = null,
                        this._pc.onicecandidate = null,
                        this._pc.ontrack = null,
                        this._pc.ondatachannel = null
                    }
                    this._pc = null,
                    this._channel = null,
                    e && this.emit("error", e),
                    this.emit("close"),
                    t()
                }
                )))
            }
            _setupData(e) {
                if (!e.channel)
                    return this.destroy(h(new Error("Data channel event is missing `channel` property"), "ERR_DATA_CHANNEL"));
                this._channel = e.channel,
                this._channel.binaryType = "arraybuffer",
                "number" == typeof this._channel.bufferedAmountLowThreshold && (this._channel.bufferedAmountLowThreshold = c),
                this.channelName = this._channel.label,
                this._channel.onmessage = e=>{
                    this._onChannelMessage(e)
                }
                ,
                this._channel.onbufferedamountlow = ()=>{
                    this._onChannelBufferedAmountLow()
                }
                ,
                this._channel.onopen = ()=>{
                    this._onChannelOpen()
                }
                ,
                this._channel.onclose = ()=>{
                    this._onChannelClose()
                }
                ,
                this._channel.onerror = e=>{
                    const t = e.error instanceof Error ? e.error : new Error(`Datachannel error: ${e.message} ${e.filename}:${e.lineno}:${e.colno}`);
                    this.destroy(h(t, "ERR_DATA_CHANNEL"))
                }
                ;
                let t = !1;
                this._closingInterval = setInterval((()=>{
                    this._channel && "closing" === this._channel.readyState ? (t && this._onChannelClose(),
                    t = !0) : t = !1
                }
                ), 5e3)
            }
            _read() {}
            _write(e, t, n) {
                if (this.destroyed)
                    return n(h(new Error("cannot write after peer is destroyed"), "ERR_DATA_CHANNEL"));
                if (this._connected) {
                    try {
                        this.send(e)
                    } catch (e) {
                        return this.destroy(h(e, "ERR_DATA_CHANNEL"))
                    }
                    this._channel.bufferedAmount > c ? (this._debug("start backpressure: bufferedAmount %d", this._channel.bufferedAmount),
                    this._cb = n) : n(null)
                } else
                    this._debug("write before connect"),
                    this._chunk = e,
                    this._cb = n
            }
            _onFinish() {
                if (this.destroyed)
                    return;
                const e = ()=>{
                    setTimeout((()=>this.destroy()), 1e3)
                }
                ;
                this._connected ? e() : this.once("connect", e)
            }
            _startIceCompleteTimeout() {
                this.destroyed || this._iceCompleteTimer || (this._debug("started iceComplete timeout"),
                this._iceCompleteTimer = setTimeout((()=>{
                    this._iceComplete || (this._iceComplete = !0,
                    this._debug("iceComplete timeout completed"),
                    this.emit("iceTimeout"),
                    this.emit("_iceComplete"))
                }
                ), this.iceCompleteTimeout))
            }
            _createOffer() {
                this.destroyed || this._pc.createOffer(this.offerOptions).then((e=>{
                    if (this.destroyed)
                        return;
                    this.trickle || this.allowHalfTrickle || (e.sdp = l(e.sdp)),
                    e.sdp = this.sdpTransform(e.sdp);
                    const t = ()=>{
                        if (this.destroyed)
                            return;
                        const t = this._pc.localDescription || e;
                        this._debug("signal"),
                        this.emit("signal", {
                            type: t.type,
                            sdp: t.sdp
                        })
                    }
                    ;
                    this._pc.setLocalDescription(e).then((()=>{
                        this._debug("createOffer success"),
                        this.destroyed || (this.trickle || this._iceComplete ? t() : this.once("_iceComplete", t))
                    }
                    )).catch((e=>{
                        this.destroy(h(e, "ERR_SET_LOCAL_DESCRIPTION"))
                    }
                    ))
                }
                )).catch((e=>{
                    this.destroy(h(e, "ERR_CREATE_OFFER"))
                }
                ))
            }
            _requestMissingTransceivers() {
                this._pc.getTransceivers && this._pc.getTransceivers().forEach((e=>{
                    e.mid || !e.sender.track || e.requested || (e.requested = !0,
                    this.addTransceiver(e.sender.track.kind))
                }
                ))
            }
            _createAnswer() {
                this.destroyed || this._pc.createAnswer(this.answerOptions).then((e=>{
                    if (this.destroyed)
                        return;
                    this.trickle || this.allowHalfTrickle || (e.sdp = l(e.sdp)),
                    e.sdp = this.sdpTransform(e.sdp);
                    const t = ()=>{
                        if (this.destroyed)
                            return;
                        const t = this._pc.localDescription || e;
                        this._debug("signal"),
                        this.emit("signal", {
                            type: t.type,
                            sdp: t.sdp
                        }),
                        this.initiator || this._requestMissingTransceivers()
                    }
                    ;
                    this._pc.setLocalDescription(e).then((()=>{
                        this.destroyed || (this.trickle || this._iceComplete ? t() : this.once("_iceComplete", t))
                    }
                    )).catch((e=>{
                        this.destroy(h(e, "ERR_SET_LOCAL_DESCRIPTION"))
                    }
                    ))
                }
                )).catch((e=>{
                    this.destroy(h(e, "ERR_CREATE_ANSWER"))
                }
                ))
            }
            _onConnectionStateChange() {
                this.destroyed || "failed" === this._pc.connectionState && this.destroy(h(new Error("Connection failed."), "ERR_CONNECTION_FAILURE"))
            }
            _onIceStateChange() {
                if (this.destroyed)
                    return;
                const e = this._pc.iceConnectionState
                  , t = this._pc.iceGatheringState;
                this._debug("iceStateChange (connection: %s) (gathering: %s)", e, t),
                this.emit("iceStateChange", e, t),
                "connected" !== e && "completed" !== e || (this._pcReady = !0,
                this._maybeReady()),
                "failed" === e && this.destroy(h(new Error("Ice connection failed."), "ERR_ICE_CONNECTION_FAILURE")),
                "closed" === e && this.destroy(h(new Error("Ice connection closed."), "ERR_ICE_CONNECTION_CLOSED"))
            }
            getStats(e) {
                const t = e=>("[object Array]" === Object.prototype.toString.call(e.values) && e.values.forEach((t=>{
                    Object.assign(e, t)
                }
                )),
                e);
                0 === this._pc.getStats.length || this._isReactNativeWebrtc ? this._pc.getStats().then((n=>{
                    const r = [];
                    n.forEach((e=>{
                        r.push(t(e))
                    }
                    )),
                    e(null, r)
                }
                ), (t=>e(t))) : this._pc.getStats.length > 0 ? this._pc.getStats((n=>{
                    if (this.destroyed)
                        return;
                    const r = [];
                    n.result().forEach((e=>{
                        const n = {};
                        e.names().forEach((t=>{
                            n[t] = e.stat(t)
                        }
                        )),
                        n.id = e.id,
                        n.type = e.type,
                        n.timestamp = e.timestamp,
                        r.push(t(n))
                    }
                    )),
                    e(null, r)
                }
                ), (t=>e(t))) : e(null, [])
            }
            _maybeReady() {
                if (this._debug("maybeReady pc %s channel %s", this._pcReady, this._channelReady),
                this._connected || this._connecting || !this._pcReady || !this._channelReady)
                    return;
                this._connecting = !0;
                const e = ()=>{
                    this.destroyed || this.getStats(((t,n)=>{
                        if (this.destroyed)
                            return;
                        t && (n = []);
                        const r = {}
                          , i = {}
                          , s = {};
                        let o = !1;
                        n.forEach((e=>{
                            "remotecandidate" !== e.type && "remote-candidate" !== e.type || (r[e.id] = e),
                            "localcandidate" !== e.type && "local-candidate" !== e.type || (i[e.id] = e),
                            "candidatepair" !== e.type && "candidate-pair" !== e.type || (s[e.id] = e)
                        }
                        ));
                        const a = e=>{
                            o = !0;
                            let t = i[e.localCandidateId];
                            t && (t.ip || t.address) ? (this.localAddress = t.ip || t.address,
                            this.localPort = Number(t.port)) : t && t.ipAddress ? (this.localAddress = t.ipAddress,
                            this.localPort = Number(t.portNumber)) : "string" == typeof e.googLocalAddress && (t = e.googLocalAddress.split(":"),
                            this.localAddress = t[0],
                            this.localPort = Number(t[1])),
                            this.localAddress && (this.localFamily = this.localAddress.includes(":") ? "IPv6" : "IPv4");
                            let n = r[e.remoteCandidateId];
                            n && (n.ip || n.address) ? (this.remoteAddress = n.ip || n.address,
                            this.remotePort = Number(n.port)) : n && n.ipAddress ? (this.remoteAddress = n.ipAddress,
                            this.remotePort = Number(n.portNumber)) : "string" == typeof e.googRemoteAddress && (n = e.googRemoteAddress.split(":"),
                            this.remoteAddress = n[0],
                            this.remotePort = Number(n[1])),
                            this.remoteAddress && (this.remoteFamily = this.remoteAddress.includes(":") ? "IPv6" : "IPv4"),
                            this._debug("connect local: %s:%s remote: %s:%s", this.localAddress, this.localPort, this.remoteAddress, this.remotePort)
                        }
                        ;
                        if (n.forEach((e=>{
                            "transport" === e.type && e.selectedCandidatePairId && a(s[e.selectedCandidatePairId]),
                            ("googCandidatePair" === e.type && "true" === e.googActiveConnection || ("candidatepair" === e.type || "candidate-pair" === e.type) && e.selected) && a(e)
                        }
                        )),
                        o || Object.keys(s).length && !Object.keys(i).length) {
                            if (this._connecting = !1,
                            this._connected = !0,
                            this._chunk) {
                                try {
                                    this.send(this._chunk)
                                } catch (t) {
                                    return this.destroy(h(t, "ERR_DATA_CHANNEL"))
                                }
                                this._chunk = null,
                                this._debug('sent chunk from "write before connect"');
                                const e = this._cb;
                                this._cb = null,
                                e(null)
                            }
                            "number" != typeof this._channel.bufferedAmountLowThreshold && (this._interval = setInterval((()=>this._onInterval()), 150),
                            this._interval.unref && this._interval.unref()),
                            this._debug("connect"),
                            this.emit("connect")
                        } else
                            setTimeout(e, 100)
                    }
                    ))
                }
                ;
                e()
            }
            _onInterval() {
                !this._cb || !this._channel || this._channel.bufferedAmount > c || this._onChannelBufferedAmountLow()
            }
            _onSignalingStateChange() {
                this.destroyed || ("stable" === this._pc.signalingState && (this._isNegotiating = !1,
                this._debug("flushing sender queue", this._sendersAwaitingStable),
                this._sendersAwaitingStable.forEach((e=>{
                    this._pc.removeTrack(e),
                    this._queuedNegotiation = !0
                }
                )),
                this._sendersAwaitingStable = [],
                this._queuedNegotiation ? (this._debug("flushing negotiation queue"),
                this._queuedNegotiation = !1,
                this._needsNegotiation()) : (this._debug("negotiated"),
                this.emit("negotiated"))),
                this._debug("signalingStateChange %s", this._pc.signalingState),
                this.emit("signalingStateChange", this._pc.signalingState))
            }
            _onIceCandidate(e) {
                this.destroyed || (e.candidate && this.trickle ? this.emit("signal", {
                    type: "candidate",
                    candidate: {
                        candidate: e.candidate.candidate,
                        sdpMLineIndex: e.candidate.sdpMLineIndex,
                        sdpMid: e.candidate.sdpMid
                    }
                }) : e.candidate || this._iceComplete || (this._iceComplete = !0,
                this.emit("_iceComplete")),
                e.candidate && this._startIceCompleteTimeout())
            }
            _onChannelMessage(e) {
                if (this.destroyed)
                    return;
                let t = e.data;
                t instanceof ArrayBuffer && (t = u.from(t)),
                this.push(t)
            }
            _onChannelBufferedAmountLow() {
                if (this.destroyed || !this._cb)
                    return;
                this._debug("ending backpressure: bufferedAmount %d", this._channel.bufferedAmount);
                const e = this._cb;
                this._cb = null,
                e(null)
            }
            _onChannelOpen() {
                this._connected || this.destroyed || (this._debug("on channel open"),
                this._channelReady = !0,
                this._maybeReady())
            }
            _onChannelClose() {
                this.destroyed || (this._debug("on channel close"),
                this.destroy())
            }
            _onTrack(e) {
                this.destroyed || e.streams.forEach((t=>{
                    this._debug("on track"),
                    this.emit("track", e.track, t),
                    this._remoteTracks.push({
                        track: e.track,
                        stream: t
                    }),
                    this._remoteStreams.some((e=>e.id === t.id)) || (this._remoteStreams.push(t),
                    a((()=>{
                        this._debug("on stream"),
                        this.emit("stream", t)
                    }
                    )))
                }
                ))
            }
            _debug() {
                const e = [].slice.call(arguments);
                e[0] = "[" + this._id + "] " + e[0],
                r.apply(null, e)
            }
        }
        d.WEBRTC_SUPPORT = !!i(),
        d.config = {
            iceServers: [{
                urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"]
            }],
            sdpSemantics: "unified-plan"
        },
        d.channelConfig = {},
        t.exports = d
    }
    , {
        buffer: "buffer",
        debug: "debug",
        "err-code": 17,
        "get-browser-rtc": 18,
        "queue-microtask": 24,
        randombytes: 25,
        "readable-stream": 40
    }],
    46: [function(e, t, n) {
        (function(n) {
            (function() {
                const r = e("debug")("simple-websocket")
                  , i = e("randombytes")
                  , s = e("readable-stream")
                  , o = e("queue-microtask")
                  , a = e("ws")
                  , h = "function" != typeof a ? WebSocket : a;
                class u extends s.Duplex {
                    constructor(e={}) {
                        if ("string" == typeof e && (e = {
                            url: e
                        }),
                        super(e = Object.assign({
                            allowHalfOpen: !1
                        }, e)),
                        null == e.url && null == e.socket)
                            throw new Error("Missing required `url` or `socket` option");
                        if (null != e.url && null != e.socket)
                            throw new Error("Must specify either `url` or `socket` option, not both");
                        if (this._id = i(4).toString("hex").slice(0, 7),
                        this._debug("new websocket: %o", e),
                        this.connected = !1,
                        this.destroyed = !1,
                        this._chunk = null,
                        this._cb = null,
                        this._interval = null,
                        e.socket)
                            this.url = e.socket.url,
                            this._ws = e.socket,
                            this.connected = e.socket.readyState === h.OPEN;
                        else {
                            this.url = e.url;
                            try {
                                this._ws = "function" == typeof a ? new h(e.url,null,{
                                    ...e,
                                    encoding: void 0
                                }) : new h(e.url)
                            } catch (e) {
                                return void o((()=>this.destroy(e)))
                            }
                        }
                        this._ws.binaryType = "arraybuffer",
                        e.socket && this.connected ? o((()=>this._handleOpen())) : this._ws.onopen = ()=>this._handleOpen(),
                        this._ws.onmessage = e=>this._handleMessage(e),
                        this._ws.onclose = ()=>this._handleClose(),
                        this._ws.onerror = e=>this._handleError(e),
                        this._handleFinishBound = ()=>this._handleFinish(),
                        this.once("finish", this._handleFinishBound)
                    }
                    send(e) {
                        this._ws.send(e)
                    }
                    destroy(e) {
                        this._destroy(e, (()=>{}
                        ))
                    }
                    _destroy(e, t) {
                        if (!this.destroyed) {
                            if (this._debug("destroy (error: %s)", e && (e.message || e)),
                            this.readable = this.writable = !1,
                            this._readableState.ended || this.push(null),
                            this._writableState.finished || this.end(),
                            this.connected = !1,
                            this.destroyed = !0,
                            clearInterval(this._interval),
                            this._interval = null,
                            this._chunk = null,
                            this._cb = null,
                            this._handleFinishBound && this.removeListener("finish", this._handleFinishBound),
                            this._handleFinishBound = null,
                            this._ws) {
                                const t = this._ws
                                  , n = ()=>{
                                    t.onclose = null
                                }
                                ;
                                if (t.readyState === h.CLOSED)
                                    n();
                                else
                                    try {
                                        t.onclose = n,
                                        t.close()
                                    } catch (e) {
                                        n()
                                    }
                                t.onopen = null,
                                t.onmessage = null,
                                t.onerror = ()=>{}
                            }
                            this._ws = null,
                            e && this.emit("error", e),
                            this.emit("close"),
                            t()
                        }
                    }
                    _read() {}
                    _write(e, t, n) {
                        if (this.destroyed)
                            return n(new Error("cannot write after socket is destroyed"));
                        if (this.connected) {
                            try {
                                this.send(e)
                            } catch (e) {
                                return this.destroy(e)
                            }
                            "function" != typeof a && this._ws.bufferedAmount > 65536 ? (this._debug("start backpressure: bufferedAmount %d", this._ws.bufferedAmount),
                            this._cb = n) : n(null)
                        } else
                            this._debug("write before connect"),
                            this._chunk = e,
                            this._cb = n
                    }
                    _handleOpen() {
                        if (!this.connected && !this.destroyed) {
                            if (this.connected = !0,
                            this._chunk) {
                                try {
                                    this.send(this._chunk)
                                } catch (e) {
                                    return this.destroy(e)
                                }
                                this._chunk = null,
                                this._debug('sent chunk from "write before connect"');
                                const e = this._cb;
                                this._cb = null,
                                e(null)
                            }
                            "function" != typeof a && (this._interval = setInterval((()=>this._onInterval()), 150),
                            this._interval.unref && this._interval.unref()),
                            this._debug("connect"),
                            this.emit("connect")
                        }
                    }
                    _handleMessage(e) {
                        if (this.destroyed)
                            return;
                        let t = e.data;
                        t instanceof ArrayBuffer && (t = n.from(t)),
                        this.push(t)
                    }
                    _handleClose() {
                        this.destroyed || (this._debug("on close"),
                        this.destroy())
                    }
                    _handleError(e) {
                        this.destroy(new Error(`Error connecting to ${this.url}`))
                    }
                    _handleFinish() {
                        if (this.destroyed)
                            return;
                        const e = ()=>{
                            setTimeout((()=>this.destroy()), 1e3)
                        }
                        ;
                        this.connected ? e() : this.once("connect", e)
                    }
                    _onInterval() {
                        if (!this._cb || !this._ws || this._ws.bufferedAmount > 65536)
                            return;
                        this._debug("ending backpressure: bufferedAmount %d", this._ws.bufferedAmount);
                        const e = this._cb;
                        this._cb = null,
                        e(null)
                    }
                    _debug() {
                        const e = [].slice.call(arguments);
                        e[0] = "[" + this._id + "] " + e[0],
                        r.apply(null, e)
                    }
                }
                u.WEBSOCKET_SUPPORT = !!h,
                t.exports = u
            }
            ).call(this)
        }
        ).call(this, e("buffer").Buffer)
    }
    , {
        buffer: "buffer",
        debug: "debug",
        "queue-microtask": 24,
        randombytes: 25,
        "readable-stream": 40,
        ws: 15
    }],
    47: [function(e, t, n) {
        "use strict";
        var r = e("safe-buffer").Buffer
          , i = r.isEncoding || function(e) {
            switch ((e = "" + e) && e.toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
            case "raw":
                return !0;
            default:
                return !1
            }
        }
        ;
        function s(e) {
            var t;
            switch (this.encoding = function(e) {
                var t = function(e) {
                    if (!e)
                        return "utf8";
                    for (var t; ; )
                        switch (e) {
                        case "utf8":
                        case "utf-8":
                            return "utf8";
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return "utf16le";
                        case "latin1":
                        case "binary":
                            return "latin1";
                        case "base64":
                        case "ascii":
                        case "hex":
                            return e;
                        default:
                            if (t)
                                return;
                            e = ("" + e).toLowerCase(),
                            t = !0
                        }
                }(e);
                if ("string" != typeof t && (r.isEncoding === i || !i(e)))
                    throw new Error("Unknown encoding: " + e);
                return t || e
            }(e),
            this.encoding) {
            case "utf16le":
                this.text = h,
                this.end = u,
                t = 4;
                break;
            case "utf8":
                this.fillLast = a,
                t = 4;
                break;
            case "base64":
                this.text = c,
                this.end = l,
                t = 3;
                break;
            default:
                return this.write = d,
                void (this.end = f)
            }
            this.lastNeed = 0,
            this.lastTotal = 0,
            this.lastChar = r.allocUnsafe(t)
        }
        function o(e) {
            return e <= 127 ? 0 : e >> 5 == 6 ? 2 : e >> 4 == 14 ? 3 : e >> 3 == 30 ? 4 : e >> 6 == 2 ? -1 : -2
        }
        function a(e) {
            var t = this.lastTotal - this.lastNeed
              , n = function(e, t, n) {
                if (128 != (192 & t[0]))
                    return e.lastNeed = 0,
                    "???";
                if (e.lastNeed > 1 && t.length > 1) {
                    if (128 != (192 & t[1]))
                        return e.lastNeed = 1,
                        "???";
                    if (e.lastNeed > 2 && t.length > 2 && 128 != (192 & t[2]))
                        return e.lastNeed = 2,
                        "???"
                }
            }(this, e);
            return void 0 !== n ? n : this.lastNeed <= e.length ? (e.copy(this.lastChar, t, 0, this.lastNeed),
            this.lastChar.toString(this.encoding, 0, this.lastTotal)) : (e.copy(this.lastChar, t, 0, e.length),
            void (this.lastNeed -= e.length))
        }
        function h(e, t) {
            if ((e.length - t) % 2 == 0) {
                var n = e.toString("utf16le", t);
                if (n) {
                    var r = n.charCodeAt(n.length - 1);
                    if (r >= 55296 && r <= 56319)
                        return this.lastNeed = 2,
                        this.lastTotal = 4,
                        this.lastChar[0] = e[e.length - 2],
                        this.lastChar[1] = e[e.length - 1],
                        n.slice(0, -1)
                }
                return n
            }
            return this.lastNeed = 1,
            this.lastTotal = 2,
            this.lastChar[0] = e[e.length - 1],
            e.toString("utf16le", t, e.length - 1)
        }
        function u(e) {
            var t = e && e.length ? this.write(e) : "";
            if (this.lastNeed) {
                var n = this.lastTotal - this.lastNeed;
                return t + this.lastChar.toString("utf16le", 0, n)
            }
            return t
        }
        function c(e, t) {
            var n = (e.length - t) % 3;
            return 0 === n ? e.toString("base64", t) : (this.lastNeed = 3 - n,
            this.lastTotal = 3,
            1 === n ? this.lastChar[0] = e[e.length - 1] : (this.lastChar[0] = e[e.length - 2],
            this.lastChar[1] = e[e.length - 1]),
            e.toString("base64", t, e.length - n))
        }
        function l(e) {
            var t = e && e.length ? this.write(e) : "";
            return this.lastNeed ? t + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : t
        }
        function d(e) {
            return e.toString(this.encoding)
        }
        function f(e) {
            return e && e.length ? this.write(e) : ""
        }
        n.StringDecoder = s,
        s.prototype.write = function(e) {
            if (0 === e.length)
                return "";
            var t, n;
            if (this.lastNeed) {
                if (void 0 === (t = this.fillLast(e)))
                    return "";
                n = this.lastNeed,
                this.lastNeed = 0
            } else
                n = 0;
            return n < e.length ? t ? t + this.text(e, n) : this.text(e, n) : t || ""
        }
        ,
        s.prototype.end = function(e) {
            var t = e && e.length ? this.write(e) : "";
            return this.lastNeed ? t + "???" : t
        }
        ,
        s.prototype.text = function(e, t) {
            var n = function(e, t, n) {
                var r = t.length - 1;
                if (r < n)
                    return 0;
                var i = o(t[r]);
                if (i >= 0)
                    return i > 0 && (e.lastNeed = i - 1),
                    i;
                if (--r < n || -2 === i)
                    return 0;
                if ((i = o(t[r])) >= 0)
                    return i > 0 && (e.lastNeed = i - 2),
                    i;
                if (--r < n || -2 === i)
                    return 0;
                if ((i = o(t[r])) >= 0)
                    return i > 0 && (2 === i ? i = 0 : e.lastNeed = i - 3),
                    i;
                return 0
            }(this, e, t);
            if (!this.lastNeed)
                return e.toString("utf8", t);
            this.lastTotal = n;
            var r = e.length - (n - this.lastNeed);
            return e.copy(this.lastChar, 0, r),
            e.toString("utf8", t, r)
        }
        ,
        s.prototype.fillLast = function(e) {
            if (this.lastNeed <= e.length)
                return e.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed),
                this.lastChar.toString(this.encoding, 0, this.lastTotal);
            e.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, e.length),
            this.lastNeed -= e.length
        }
    }
    , {
        "safe-buffer": 42
    }],
    48: [function(e, t, n) {
        (function(e) {
            (function() {
                function n(t) {
                    try {
                        if (!e.localStorage)
                            return !1
                    } catch (e) {
                        return !1
                    }
                    var n = e.localStorage[t];
                    return null != n && "true" === String(n).toLowerCase()
                }
                t.exports = function(e, t) {
                    if (n("noDeprecation"))
                        return e;
                    var r = !1;
                    return function() {
                        if (!r) {
                            if (n("throwDeprecation"))
                                throw new Error(t);
                            n("traceDeprecation") ? console.trace(t) : console.warn(t),
                            r = !0
                        }
                        return e.apply(this, arguments)
                    }
                }
            }
            ).call(this)
        }
        ).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }
    , {}],
    49: [function(e, t, n) {
        t.exports = function e(t, n) {
            if (t && n)
                return e(t)(n);
            if ("function" != typeof t)
                throw new TypeError("need wrapper function");
            return Object.keys(t).forEach((function(e) {
                r[e] = t[e]
            }
            )),
            r;
            function r() {
                for (var e = new Array(arguments.length), n = 0; n < e.length; n++)
                    e[n] = arguments[n];
                var r = t.apply(this, e)
                  , i = e[e.length - 1];
                return "function" == typeof r && r !== i && Object.keys(i).forEach((function(e) {
                    r[e] = i[e]
                }
                )),
                r
            }
        }
    }
    , {}],
    buffer: [function(e, t, n) {
        (function(t) {
            (function() {
                "use strict";
                var t = e("base64-js")
                  , r = e("ieee754");
                n.Buffer = o,
                n.SlowBuffer = function(e) {
                    +e != e && (e = 0);
                    return o.alloc(+e)
                }
                ,
                n.INSPECT_MAX_BYTES = 50;
                var i = 2147483647;
                function s(e) {
                    if (e > i)
                        throw new RangeError('The value "' + e + '" is invalid for option "size"');
                    var t = new Uint8Array(e);
                    return t.__proto__ = o.prototype,
                    t
                }
                function o(e, t, n) {
                    if ("number" == typeof e) {
                        if ("string" == typeof t)
                            throw new TypeError('The "string" argument must be of type string. Received type number');
                        return u(e)
                    }
                    return a(e, t, n)
                }
                function a(e, t, n) {
                    if ("string" == typeof e)
                        return function(e, t) {
                            "string" == typeof t && "" !== t || (t = "utf8");
                            if (!o.isEncoding(t))
                                throw new TypeError("Unknown encoding: " + t);
                            var n = 0 | d(e, t)
                              , r = s(n)
                              , i = r.write(e, t);
                            i !== n && (r = r.slice(0, i));
                            return r
                        }(e, t);
                    if (ArrayBuffer.isView(e))
                        return c(e);
                    if (null == e)
                        throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e);
                    if (F(e, ArrayBuffer) || e && F(e.buffer, ArrayBuffer))
                        return function(e, t, n) {
                            if (t < 0 || e.byteLength < t)
                                throw new RangeError('"offset" is outside of buffer bounds');
                            if (e.byteLength < t + (n || 0))
                                throw new RangeError('"length" is outside of buffer bounds');
                            var r;
                            r = void 0 === t && void 0 === n ? new Uint8Array(e) : void 0 === n ? new Uint8Array(e,t) : new Uint8Array(e,t,n);
                            return r.__proto__ = o.prototype,
                            r
                        }(e, t, n);
                    if ("number" == typeof e)
                        throw new TypeError('The "value" argument must not be of type number. Received type number');
                    var r = e.valueOf && e.valueOf();
                    if (null != r && r !== e)
                        return o.from(r, t, n);
                    var i = function(e) {
                        if (o.isBuffer(e)) {
                            var t = 0 | l(e.length)
                              , n = s(t);
                            return 0 === n.length || e.copy(n, 0, 0, t),
                            n
                        }
                        if (void 0 !== e.length)
                            return "number" != typeof e.length || q(e.length) ? s(0) : c(e);
                        if ("Buffer" === e.type && Array.isArray(e.data))
                            return c(e.data)
                    }(e);
                    if (i)
                        return i;
                    if ("undefined" != typeof Symbol && null != Symbol.toPrimitive && "function" == typeof e[Symbol.toPrimitive])
                        return o.from(e[Symbol.toPrimitive]("string"), t, n);
                    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof e)
                }
                function h(e) {
                    if ("number" != typeof e)
                        throw new TypeError('"size" argument must be of type number');
                    if (e < 0)
                        throw new RangeError('The value "' + e + '" is invalid for option "size"')
                }
                function u(e) {
                    return h(e),
                    s(e < 0 ? 0 : 0 | l(e))
                }
                function c(e) {
                    for (var t = e.length < 0 ? 0 : 0 | l(e.length), n = s(t), r = 0; r < t; r += 1)
                        n[r] = 255 & e[r];
                    return n
                }
                function l(e) {
                    if (e >= i)
                        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + i.toString(16) + " bytes");
                    return 0 | e
                }
                function d(e, t) {
                    if (o.isBuffer(e))
                        return e.length;
                    if (ArrayBuffer.isView(e) || F(e, ArrayBuffer))
                        return e.byteLength;
                    if ("string" != typeof e)
                        throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof e);
                    var n = e.length
                      , r = arguments.length > 2 && !0 === arguments[2];
                    if (!r && 0 === n)
                        return 0;
                    for (var i = !1; ; )
                        switch (t) {
                        case "ascii":
                        case "latin1":
                        case "binary":
                            return n;
                        case "utf8":
                        case "utf-8":
                            return N(e).length;
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return 2 * n;
                        case "hex":
                            return n >>> 1;
                        case "base64":
                            return j(e).length;
                        default:
                            if (i)
                                return r ? -1 : N(e).length;
                            t = ("" + t).toLowerCase(),
                            i = !0
                        }
                }
                function f(e, t, n) {
                    var r = !1;
                    if ((void 0 === t || t < 0) && (t = 0),
                    t > this.length)
                        return "";
                    if ((void 0 === n || n > this.length) && (n = this.length),
                    n <= 0)
                        return "";
                    if ((n >>>= 0) <= (t >>>= 0))
                        return "";
                    for (e || (e = "utf8"); ; )
                        switch (e) {
                        case "hex":
                            return M(this, t, n);
                        case "utf8":
                        case "utf-8":
                            return C(this, t, n);
                        case "ascii":
                            return T(this, t, n);
                        case "latin1":
                        case "binary":
                            return k(this, t, n);
                        case "base64":
                            return E(this, t, n);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return A(this, t, n);
                        default:
                            if (r)
                                throw new TypeError("Unknown encoding: " + e);
                            e = (e + "").toLowerCase(),
                            r = !0
                        }
                }
                function p(e, t, n) {
                    var r = e[t];
                    e[t] = e[n],
                    e[n] = r
                }
                function g(e, t, n, r, i) {
                    if (0 === e.length)
                        return -1;
                    if ("string" == typeof n ? (r = n,
                    n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648),
                    q(n = +n) && (n = i ? 0 : e.length - 1),
                    n < 0 && (n = e.length + n),
                    n >= e.length) {
                        if (i)
                            return -1;
                        n = e.length - 1
                    } else if (n < 0) {
                        if (!i)
                            return -1;
                        n = 0
                    }
                    if ("string" == typeof t && (t = o.from(t, r)),
                    o.isBuffer(t))
                        return 0 === t.length ? -1 : m(e, t, n, r, i);
                    if ("number" == typeof t)
                        return t &= 255,
                        "function" == typeof Uint8Array.prototype.indexOf ? i ? Uint8Array.prototype.indexOf.call(e, t, n) : Uint8Array.prototype.lastIndexOf.call(e, t, n) : m(e, [t], n, r, i);
                    throw new TypeError("val must be string, number or Buffer")
                }
                function m(e, t, n, r, i) {
                    var s, o = 1, a = e.length, h = t.length;
                    if (void 0 !== r && ("ucs2" === (r = String(r).toLowerCase()) || "ucs-2" === r || "utf16le" === r || "utf-16le" === r)) {
                        if (e.length < 2 || t.length < 2)
                            return -1;
                        o = 2,
                        a /= 2,
                        h /= 2,
                        n /= 2
                    }
                    function u(e, t) {
                        return 1 === o ? e[t] : e.readUInt16BE(t * o)
                    }
                    if (i) {
                        var c = -1;
                        for (s = n; s < a; s++)
                            if (u(e, s) === u(t, -1 === c ? 0 : s - c)) {
                                if (-1 === c && (c = s),
                                s - c + 1 === h)
                                    return c * o
                            } else
                                -1 !== c && (s -= s - c),
                                c = -1
                    } else
                        for (n + h > a && (n = a - h),
                        s = n; s >= 0; s--) {
                            for (var l = !0, d = 0; d < h; d++)
                                if (u(e, s + d) !== u(t, d)) {
                                    l = !1;
                                    break
                                }
                            if (l)
                                return s
                        }
                    return -1
                }
                function y(e, t, n, r) {
                    n = Number(n) || 0;
                    var i = e.length - n;
                    r ? (r = Number(r)) > i && (r = i) : r = i;
                    var s = t.length;
                    r > s / 2 && (r = s / 2);
                    for (var o = 0; o < r; ++o) {
                        var a = parseInt(t.substr(2 * o, 2), 16);
                        if (q(a))
                            return o;
                        e[n + o] = a
                    }
                    return o
                }
                function b(e, t, n, r) {
                    return U(N(t, e.length - n), e, n, r)
                }
                function _(e, t, n, r) {
                    return U(function(e) {
                        for (var t = [], n = 0; n < e.length; ++n)
                            t.push(255 & e.charCodeAt(n));
                        return t
                    }(t), e, n, r)
                }
                function w(e, t, n, r) {
                    return _(e, t, n, r)
                }
                function v(e, t, n, r) {
                    return U(j(t), e, n, r)
                }
                function S(e, t, n, r) {
                    return U(function(e, t) {
                        for (var n, r, i, s = [], o = 0; o < e.length && !((t -= 2) < 0); ++o)
                            r = (n = e.charCodeAt(o)) >> 8,
                            i = n % 256,
                            s.push(i),
                            s.push(r);
                        return s
                    }(t, e.length - n), e, n, r)
                }
                function E(e, n, r) {
                    return 0 === n && r === e.length ? t.fromByteArray(e) : t.fromByteArray(e.slice(n, r))
                }
                function C(e, t, n) {
                    n = Math.min(e.length, n);
                    for (var r = [], i = t; i < n; ) {
                        var s, o, a, h, u = e[i], c = null, l = u > 239 ? 4 : u > 223 ? 3 : u > 191 ? 2 : 1;
                        if (i + l <= n)
                            switch (l) {
                            case 1:
                                u < 128 && (c = u);
                                break;
                            case 2:
                                128 == (192 & (s = e[i + 1])) && (h = (31 & u) << 6 | 63 & s) > 127 && (c = h);
                                break;
                            case 3:
                                s = e[i + 1],
                                o = e[i + 2],
                                128 == (192 & s) && 128 == (192 & o) && (h = (15 & u) << 12 | (63 & s) << 6 | 63 & o) > 2047 && (h < 55296 || h > 57343) && (c = h);
                                break;
                            case 4:
                                s = e[i + 1],
                                o = e[i + 2],
                                a = e[i + 3],
                                128 == (192 & s) && 128 == (192 & o) && 128 == (192 & a) && (h = (15 & u) << 18 | (63 & s) << 12 | (63 & o) << 6 | 63 & a) > 65535 && h < 1114112 && (c = h)
                            }
                        null === c ? (c = 65533,
                        l = 1) : c > 65535 && (c -= 65536,
                        r.push(c >>> 10 & 1023 | 55296),
                        c = 56320 | 1023 & c),
                        r.push(c),
                        i += l
                    }
                    return function(e) {
                        var t = e.length;
                        if (t <= R)
                            return String.fromCharCode.apply(String, e);
                        var n = ""
                          , r = 0;
                        for (; r < t; )
                            n += String.fromCharCode.apply(String, e.slice(r, r += R));
                        return n
                    }(r)
                }
                n.kMaxLength = i,
                o.TYPED_ARRAY_SUPPORT = function() {
                    try {
                        var e = new Uint8Array(1);
                        return e.__proto__ = {
                            __proto__: Uint8Array.prototype,
                            foo: function() {
                                return 42
                            }
                        },
                        42 === e.foo()
                    } catch (e) {
                        return !1
                    }
                }(),
                o.TYPED_ARRAY_SUPPORT || "undefined" == typeof console || "function" != typeof console.error || console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."),
                Object.defineProperty(o.prototype, "parent", {
                    enumerable: !0,
                    get: function() {
                        if (o.isBuffer(this))
                            return this.buffer
                    }
                }),
                Object.defineProperty(o.prototype, "offset", {
                    enumerable: !0,
                    get: function() {
                        if (o.isBuffer(this))
                            return this.byteOffset
                    }
                }),
                "undefined" != typeof Symbol && null != Symbol.species && o[Symbol.species] === o && Object.defineProperty(o, Symbol.species, {
                    value: null,
                    configurable: !0,
                    enumerable: !1,
                    writable: !1
                }),
                o.poolSize = 8192,
                o.from = function(e, t, n) {
                    return a(e, t, n)
                }
                ,
                o.prototype.__proto__ = Uint8Array.prototype,
                o.__proto__ = Uint8Array,
                o.alloc = function(e, t, n) {
                    return function(e, t, n) {
                        return h(e),
                        e <= 0 ? s(e) : void 0 !== t ? "string" == typeof n ? s(e).fill(t, n) : s(e).fill(t) : s(e)
                    }(e, t, n)
                }
                ,
                o.allocUnsafe = function(e) {
                    return u(e)
                }
                ,
                o.allocUnsafeSlow = function(e) {
                    return u(e)
                }
                ,
                o.isBuffer = function(e) {
                    return null != e && !0 === e._isBuffer && e !== o.prototype
                }
                ,
                o.compare = function(e, t) {
                    if (F(e, Uint8Array) && (e = o.from(e, e.offset, e.byteLength)),
                    F(t, Uint8Array) && (t = o.from(t, t.offset, t.byteLength)),
                    !o.isBuffer(e) || !o.isBuffer(t))
                        throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
                    if (e === t)
                        return 0;
                    for (var n = e.length, r = t.length, i = 0, s = Math.min(n, r); i < s; ++i)
                        if (e[i] !== t[i]) {
                            n = e[i],
                            r = t[i];
                            break
                        }
                    return n < r ? -1 : r < n ? 1 : 0
                }
                ,
                o.isEncoding = function(e) {
                    switch (String(e).toLowerCase()) {
                    case "hex":
                    case "utf8":
                    case "utf-8":
                    case "ascii":
                    case "latin1":
                    case "binary":
                    case "base64":
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                        return !0;
                    default:
                        return !1
                    }
                }
                ,
                o.concat = function(e, t) {
                    if (!Array.isArray(e))
                        throw new TypeError('"list" argument must be an Array of Buffers');
                    if (0 === e.length)
                        return o.alloc(0);
                    var n;
                    if (void 0 === t)
                        for (t = 0,
                        n = 0; n < e.length; ++n)
                            t += e[n].length;
                    var r = o.allocUnsafe(t)
                      , i = 0;
                    for (n = 0; n < e.length; ++n) {
                        var s = e[n];
                        if (F(s, Uint8Array) && (s = o.from(s)),
                        !o.isBuffer(s))
                            throw new TypeError('"list" argument must be an Array of Buffers');
                        s.copy(r, i),
                        i += s.length
                    }
                    return r
                }
                ,
                o.byteLength = d,
                o.prototype._isBuffer = !0,
                o.prototype.swap16 = function() {
                    var e = this.length;
                    if (e % 2 != 0)
                        throw new RangeError("Buffer size must be a multiple of 16-bits");
                    for (var t = 0; t < e; t += 2)
                        p(this, t, t + 1);
                    return this
                }
                ,
                o.prototype.swap32 = function() {
                    var e = this.length;
                    if (e % 4 != 0)
                        throw new RangeError("Buffer size must be a multiple of 32-bits");
                    for (var t = 0; t < e; t += 4)
                        p(this, t, t + 3),
                        p(this, t + 1, t + 2);
                    return this
                }
                ,
                o.prototype.swap64 = function() {
                    var e = this.length;
                    if (e % 8 != 0)
                        throw new RangeError("Buffer size must be a multiple of 64-bits");
                    for (var t = 0; t < e; t += 8)
                        p(this, t, t + 7),
                        p(this, t + 1, t + 6),
                        p(this, t + 2, t + 5),
                        p(this, t + 3, t + 4);
                    return this
                }
                ,
                o.prototype.toString = function() {
                    var e = this.length;
                    return 0 === e ? "" : 0 === arguments.length ? C(this, 0, e) : f.apply(this, arguments)
                }
                ,
                o.prototype.toLocaleString = o.prototype.toString,
                o.prototype.equals = function(e) {
                    if (!o.isBuffer(e))
                        throw new TypeError("Argument must be a Buffer");
                    return this === e || 0 === o.compare(this, e)
                }
                ,
                o.prototype.inspect = function() {
                    var e = ""
                      , t = n.INSPECT_MAX_BYTES;
                    return e = this.toString("hex", 0, t).replace(/(.{2})/g, "$1 ").trim(),
                    this.length > t && (e += " ... "),
                    "<Buffer " + e + ">"
                }
                ,
                o.prototype.compare = function(e, t, n, r, i) {
                    if (F(e, Uint8Array) && (e = o.from(e, e.offset, e.byteLength)),
                    !o.isBuffer(e))
                        throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof e);
                    if (void 0 === t && (t = 0),
                    void 0 === n && (n = e ? e.length : 0),
                    void 0 === r && (r = 0),
                    void 0 === i && (i = this.length),
                    t < 0 || n > e.length || r < 0 || i > this.length)
                        throw new RangeError("out of range index");
                    if (r >= i && t >= n)
                        return 0;
                    if (r >= i)
                        return -1;
                    if (t >= n)
                        return 1;
                    if (this === e)
                        return 0;
                    for (var s = (i >>>= 0) - (r >>>= 0), a = (n >>>= 0) - (t >>>= 0), h = Math.min(s, a), u = this.slice(r, i), c = e.slice(t, n), l = 0; l < h; ++l)
                        if (u[l] !== c[l]) {
                            s = u[l],
                            a = c[l];
                            break
                        }
                    return s < a ? -1 : a < s ? 1 : 0
                }
                ,
                o.prototype.includes = function(e, t, n) {
                    return -1 !== this.indexOf(e, t, n)
                }
                ,
                o.prototype.indexOf = function(e, t, n) {
                    return g(this, e, t, n, !0)
                }
                ,
                o.prototype.lastIndexOf = function(e, t, n) {
                    return g(this, e, t, n, !1)
                }
                ,
                o.prototype.write = function(e, t, n, r) {
                    if (void 0 === t)
                        r = "utf8",
                        n = this.length,
                        t = 0;
                    else if (void 0 === n && "string" == typeof t)
                        r = t,
                        n = this.length,
                        t = 0;
                    else {
                        if (!isFinite(t))
                            throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
                        t >>>= 0,
                        isFinite(n) ? (n >>>= 0,
                        void 0 === r && (r = "utf8")) : (r = n,
                        n = void 0)
                    }
                    var i = this.length - t;
                    if ((void 0 === n || n > i) && (n = i),
                    e.length > 0 && (n < 0 || t < 0) || t > this.length)
                        throw new RangeError("Attempt to write outside buffer bounds");
                    r || (r = "utf8");
                    for (var s = !1; ; )
                        switch (r) {
                        case "hex":
                            return y(this, e, t, n);
                        case "utf8":
                        case "utf-8":
                            return b(this, e, t, n);
                        case "ascii":
                            return _(this, e, t, n);
                        case "latin1":
                        case "binary":
                            return w(this, e, t, n);
                        case "base64":
                            return v(this, e, t, n);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return S(this, e, t, n);
                        default:
                            if (s)
                                throw new TypeError("Unknown encoding: " + r);
                            r = ("" + r).toLowerCase(),
                            s = !0
                        }
                }
                ,
                o.prototype.toJSON = function() {
                    return {
                        type: "Buffer",
                        data: Array.prototype.slice.call(this._arr || this, 0)
                    }
                }
                ;
                var R = 4096;
                function T(e, t, n) {
                    var r = "";
                    n = Math.min(e.length, n);
                    for (var i = t; i < n; ++i)
                        r += String.fromCharCode(127 & e[i]);
                    return r
                }
                function k(e, t, n) {
                    var r = "";
                    n = Math.min(e.length, n);
                    for (var i = t; i < n; ++i)
                        r += String.fromCharCode(e[i]);
                    return r
                }
                function M(e, t, n) {
                    var r = e.length;
                    (!t || t < 0) && (t = 0),
                    (!n || n < 0 || n > r) && (n = r);
                    for (var i = "", s = t; s < n; ++s)
                        i += B(e[s]);
                    return i
                }
                function A(e, t, n) {
                    for (var r = e.slice(t, n), i = "", s = 0; s < r.length; s += 2)
                        i += String.fromCharCode(r[s] + 256 * r[s + 1]);
                    return i
                }
                function I(e, t, n) {
                    if (e % 1 != 0 || e < 0)
                        throw new RangeError("offset is not uint");
                    if (e + t > n)
                        throw new RangeError("Trying to access beyond buffer length")
                }
                function O(e, t, n, r, i, s) {
                    if (!o.isBuffer(e))
                        throw new TypeError('"buffer" argument must be a Buffer instance');
                    if (t > i || t < s)
                        throw new RangeError('"value" argument is out of bounds');
                    if (n + r > e.length)
                        throw new RangeError("Index out of range")
                }
                function P(e, t, n, r, i, s) {
                    if (n + r > e.length)
                        throw new RangeError("Index out of range");
                    if (n < 0)
                        throw new RangeError("Index out of range")
                }
                function D(e, t, n, i, s) {
                    return t = +t,
                    n >>>= 0,
                    s || P(e, 0, n, 4),
                    r.write(e, t, n, i, 23, 4),
                    n + 4
                }
                function x(e, t, n, i, s) {
                    return t = +t,
                    n >>>= 0,
                    s || P(e, 0, n, 8),
                    r.write(e, t, n, i, 52, 8),
                    n + 8
                }
                o.prototype.slice = function(e, t) {
                    var n = this.length;
                    (e = ~~e) < 0 ? (e += n) < 0 && (e = 0) : e > n && (e = n),
                    (t = void 0 === t ? n : ~~t) < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n),
                    t < e && (t = e);
                    var r = this.subarray(e, t);
                    return r.__proto__ = o.prototype,
                    r
                }
                ,
                o.prototype.readUIntLE = function(e, t, n) {
                    e >>>= 0,
                    t >>>= 0,
                    n || I(e, t, this.length);
                    for (var r = this[e], i = 1, s = 0; ++s < t && (i *= 256); )
                        r += this[e + s] * i;
                    return r
                }
                ,
                o.prototype.readUIntBE = function(e, t, n) {
                    e >>>= 0,
                    t >>>= 0,
                    n || I(e, t, this.length);
                    for (var r = this[e + --t], i = 1; t > 0 && (i *= 256); )
                        r += this[e + --t] * i;
                    return r
                }
                ,
                o.prototype.readUInt8 = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 1, this.length),
                    this[e]
                }
                ,
                o.prototype.readUInt16LE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 2, this.length),
                    this[e] | this[e + 1] << 8
                }
                ,
                o.prototype.readUInt16BE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 2, this.length),
                    this[e] << 8 | this[e + 1]
                }
                ,
                o.prototype.readUInt32LE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 4, this.length),
                    (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + 16777216 * this[e + 3]
                }
                ,
                o.prototype.readUInt32BE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 4, this.length),
                    16777216 * this[e] + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3])
                }
                ,
                o.prototype.readIntLE = function(e, t, n) {
                    e >>>= 0,
                    t >>>= 0,
                    n || I(e, t, this.length);
                    for (var r = this[e], i = 1, s = 0; ++s < t && (i *= 256); )
                        r += this[e + s] * i;
                    return r >= (i *= 128) && (r -= Math.pow(2, 8 * t)),
                    r
                }
                ,
                o.prototype.readIntBE = function(e, t, n) {
                    e >>>= 0,
                    t >>>= 0,
                    n || I(e, t, this.length);
                    for (var r = t, i = 1, s = this[e + --r]; r > 0 && (i *= 256); )
                        s += this[e + --r] * i;
                    return s >= (i *= 128) && (s -= Math.pow(2, 8 * t)),
                    s
                }
                ,
                o.prototype.readInt8 = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 1, this.length),
                    128 & this[e] ? -1 * (255 - this[e] + 1) : this[e]
                }
                ,
                o.prototype.readInt16LE = function(e, t) {
                    e >>>= 0,
                    t || I(e, 2, this.length);
                    var n = this[e] | this[e + 1] << 8;
                    return 32768 & n ? 4294901760 | n : n
                }
                ,
                o.prototype.readInt16BE = function(e, t) {
                    e >>>= 0,
                    t || I(e, 2, this.length);
                    var n = this[e + 1] | this[e] << 8;
                    return 32768 & n ? 4294901760 | n : n
                }
                ,
                o.prototype.readInt32LE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 4, this.length),
                    this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24
                }
                ,
                o.prototype.readInt32BE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 4, this.length),
                    this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]
                }
                ,
                o.prototype.readFloatLE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 4, this.length),
                    r.read(this, e, !0, 23, 4)
                }
                ,
                o.prototype.readFloatBE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 4, this.length),
                    r.read(this, e, !1, 23, 4)
                }
                ,
                o.prototype.readDoubleLE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 8, this.length),
                    r.read(this, e, !0, 52, 8)
                }
                ,
                o.prototype.readDoubleBE = function(e, t) {
                    return e >>>= 0,
                    t || I(e, 8, this.length),
                    r.read(this, e, !1, 52, 8)
                }
                ,
                o.prototype.writeUIntLE = function(e, t, n, r) {
                    (e = +e,
                    t >>>= 0,
                    n >>>= 0,
                    r) || O(this, e, t, n, Math.pow(2, 8 * n) - 1, 0);
                    var i = 1
                      , s = 0;
                    for (this[t] = 255 & e; ++s < n && (i *= 256); )
                        this[t + s] = e / i & 255;
                    return t + n
                }
                ,
                o.prototype.writeUIntBE = function(e, t, n, r) {
                    (e = +e,
                    t >>>= 0,
                    n >>>= 0,
                    r) || O(this, e, t, n, Math.pow(2, 8 * n) - 1, 0);
                    var i = n - 1
                      , s = 1;
                    for (this[t + i] = 255 & e; --i >= 0 && (s *= 256); )
                        this[t + i] = e / s & 255;
                    return t + n
                }
                ,
                o.prototype.writeUInt8 = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 1, 255, 0),
                    this[t] = 255 & e,
                    t + 1
                }
                ,
                o.prototype.writeUInt16LE = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 2, 65535, 0),
                    this[t] = 255 & e,
                    this[t + 1] = e >>> 8,
                    t + 2
                }
                ,
                o.prototype.writeUInt16BE = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 2, 65535, 0),
                    this[t] = e >>> 8,
                    this[t + 1] = 255 & e,
                    t + 2
                }
                ,
                o.prototype.writeUInt32LE = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 4, 4294967295, 0),
                    this[t + 3] = e >>> 24,
                    this[t + 2] = e >>> 16,
                    this[t + 1] = e >>> 8,
                    this[t] = 255 & e,
                    t + 4
                }
                ,
                o.prototype.writeUInt32BE = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 4, 4294967295, 0),
                    this[t] = e >>> 24,
                    this[t + 1] = e >>> 16,
                    this[t + 2] = e >>> 8,
                    this[t + 3] = 255 & e,
                    t + 4
                }
                ,
                o.prototype.writeIntLE = function(e, t, n, r) {
                    if (e = +e,
                    t >>>= 0,
                    !r) {
                        var i = Math.pow(2, 8 * n - 1);
                        O(this, e, t, n, i - 1, -i)
                    }
                    var s = 0
                      , o = 1
                      , a = 0;
                    for (this[t] = 255 & e; ++s < n && (o *= 256); )
                        e < 0 && 0 === a && 0 !== this[t + s - 1] && (a = 1),
                        this[t + s] = (e / o >> 0) - a & 255;
                    return t + n
                }
                ,
                o.prototype.writeIntBE = function(e, t, n, r) {
                    if (e = +e,
                    t >>>= 0,
                    !r) {
                        var i = Math.pow(2, 8 * n - 1);
                        O(this, e, t, n, i - 1, -i)
                    }
                    var s = n - 1
                      , o = 1
                      , a = 0;
                    for (this[t + s] = 255 & e; --s >= 0 && (o *= 256); )
                        e < 0 && 0 === a && 0 !== this[t + s + 1] && (a = 1),
                        this[t + s] = (e / o >> 0) - a & 255;
                    return t + n
                }
                ,
                o.prototype.writeInt8 = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 1, 127, -128),
                    e < 0 && (e = 255 + e + 1),
                    this[t] = 255 & e,
                    t + 1
                }
                ,
                o.prototype.writeInt16LE = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 2, 32767, -32768),
                    this[t] = 255 & e,
                    this[t + 1] = e >>> 8,
                    t + 2
                }
                ,
                o.prototype.writeInt16BE = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 2, 32767, -32768),
                    this[t] = e >>> 8,
                    this[t + 1] = 255 & e,
                    t + 2
                }
                ,
                o.prototype.writeInt32LE = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 4, 2147483647, -2147483648),
                    this[t] = 255 & e,
                    this[t + 1] = e >>> 8,
                    this[t + 2] = e >>> 16,
                    this[t + 3] = e >>> 24,
                    t + 4
                }
                ,
                o.prototype.writeInt32BE = function(e, t, n) {
                    return e = +e,
                    t >>>= 0,
                    n || O(this, e, t, 4, 2147483647, -2147483648),
                    e < 0 && (e = 4294967295 + e + 1),
                    this[t] = e >>> 24,
                    this[t + 1] = e >>> 16,
                    this[t + 2] = e >>> 8,
                    this[t + 3] = 255 & e,
                    t + 4
                }
                ,
                o.prototype.writeFloatLE = function(e, t, n) {
                    return D(this, e, t, !0, n)
                }
                ,
                o.prototype.writeFloatBE = function(e, t, n) {
                    return D(this, e, t, !1, n)
                }
                ,
                o.prototype.writeDoubleLE = function(e, t, n) {
                    return x(this, e, t, !0, n)
                }
                ,
                o.prototype.writeDoubleBE = function(e, t, n) {
                    return x(this, e, t, !1, n)
                }
                ,
                o.prototype.copy = function(e, t, n, r) {
                    if (!o.isBuffer(e))
                        throw new TypeError("argument should be a Buffer");
                    if (n || (n = 0),
                    r || 0 === r || (r = this.length),
                    t >= e.length && (t = e.length),
                    t || (t = 0),
                    r > 0 && r < n && (r = n),
                    r === n)
                        return 0;
                    if (0 === e.length || 0 === this.length)
                        return 0;
                    if (t < 0)
                        throw new RangeError("targetStart out of bounds");
                    if (n < 0 || n >= this.length)
                        throw new RangeError("Index out of range");
                    if (r < 0)
                        throw new RangeError("sourceEnd out of bounds");
                    r > this.length && (r = this.length),
                    e.length - t < r - n && (r = e.length - t + n);
                    var i = r - n;
                    if (this === e && "function" == typeof Uint8Array.prototype.copyWithin)
                        this.copyWithin(t, n, r);
                    else if (this === e && n < t && t < r)
                        for (var s = i - 1; s >= 0; --s)
                            e[s + t] = this[s + n];
                    else
                        Uint8Array.prototype.set.call(e, this.subarray(n, r), t);
                    return i
                }
                ,
                o.prototype.fill = function(e, t, n, r) {
                    if ("string" == typeof e) {
                        if ("string" == typeof t ? (r = t,
                        t = 0,
                        n = this.length) : "string" == typeof n && (r = n,
                        n = this.length),
                        void 0 !== r && "string" != typeof r)
                            throw new TypeError("encoding must be a string");
                        if ("string" == typeof r && !o.isEncoding(r))
                            throw new TypeError("Unknown encoding: " + r);
                        if (1 === e.length) {
                            var i = e.charCodeAt(0);
                            ("utf8" === r && i < 128 || "latin1" === r) && (e = i)
                        }
                    } else
                        "number" == typeof e && (e &= 255);
                    if (t < 0 || this.length < t || this.length < n)
                        throw new RangeError("Out of range index");
                    if (n <= t)
                        return this;
                    var s;
                    if (t >>>= 0,
                    n = void 0 === n ? this.length : n >>> 0,
                    e || (e = 0),
                    "number" == typeof e)
                        for (s = t; s < n; ++s)
                            this[s] = e;
                    else {
                        var a = o.isBuffer(e) ? e : o.from(e, r)
                          , h = a.length;
                        if (0 === h)
                            throw new TypeError('The value "' + e + '" is invalid for argument "value"');
                        for (s = 0; s < n - t; ++s)
                            this[s + t] = a[s % h]
                    }
                    return this
                }
                ;
                var L = /[^+/0-9A-Za-z-_]/g;
                function B(e) {
                    return e < 16 ? "0" + e.toString(16) : e.toString(16)
                }
                function N(e, t) {
                    var n;
                    t = t || 1 / 0;
                    for (var r = e.length, i = null, s = [], o = 0; o < r; ++o) {
                        if ((n = e.charCodeAt(o)) > 55295 && n < 57344) {
                            if (!i) {
                                if (n > 56319) {
                                    (t -= 3) > -1 && s.push(239, 191, 189);
                                    continue
                                }
                                if (o + 1 === r) {
                                    (t -= 3) > -1 && s.push(239, 191, 189);
                                    continue
                                }
                                i = n;
                                continue
                            }
                            if (n < 56320) {
                                (t -= 3) > -1 && s.push(239, 191, 189),
                                i = n;
                                continue
                            }
                            n = 65536 + (i - 55296 << 10 | n - 56320)
                        } else
                            i && (t -= 3) > -1 && s.push(239, 191, 189);
                        if (i = null,
                        n < 128) {
                            if ((t -= 1) < 0)
                                break;
                            s.push(n)
                        } else if (n < 2048) {
                            if ((t -= 2) < 0)
                                break;
                            s.push(n >> 6 | 192, 63 & n | 128)
                        } else if (n < 65536) {
                            if ((t -= 3) < 0)
                                break;
                            s.push(n >> 12 | 224, n >> 6 & 63 | 128, 63 & n | 128)
                        } else {
                            if (!(n < 1114112))
                                throw new Error("Invalid code point");
                            if ((t -= 4) < 0)
                                break;
                            s.push(n >> 18 | 240, n >> 12 & 63 | 128, n >> 6 & 63 | 128, 63 & n | 128)
                        }
                    }
                    return s
                }
                function j(e) {
                    return t.toByteArray(function(e) {
                        if ((e = (e = e.split("=")[0]).trim().replace(L, "")).length < 2)
                            return "";
                        for (; e.length % 4 != 0; )
                            e += "=";
                        return e
                    }(e))
                }
                function U(e, t, n, r) {
                    for (var i = 0; i < r && !(i + n >= t.length || i >= e.length); ++i)
                        t[i + n] = e[i];
                    return i
                }
                function F(e, t) {
                    return e instanceof t || null != e && null != e.constructor && null != e.constructor.name && e.constructor.name === t.name
                }
                function q(e) {
                    return e != e
                }
            }
            ).call(this)
        }
        ).call(this, e("buffer").Buffer)
    }
    , {
        "base64-js": 10,
        buffer: "buffer",
        ieee754: 19
    }],
    debug: [function(e, t, n) {
        (function(r) {
            (function() {
                n.formatArgs = function(e) {
                    if (e[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + e[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff),
                    !this.useColors)
                        return;
                    const n = "color: " + this.color;
                    e.splice(1, 0, n, "color: inherit");
                    let r = 0
                      , i = 0;
                    e[0].replace(/%[a-zA-Z%]/g, (e=>{
                        "%%" !== e && (r++,
                        "%c" === e && (i = r))
                    }
                    )),
                    e.splice(i, 0, n)
                }
                ,
                n.save = function(e) {
                    try {
                        e ? n.storage.setItem("debug", e) : n.storage.removeItem("debug")
                    } catch (e) {}
                }
                ,
                n.load = function() {
                    let e;
                    try {
                        e = n.storage.getItem("debug")
                    } catch (e) {}
                    !e && void 0 !== r && "env"in r && (e = r.env.DEBUG);
                    return e
                }
                ,
                n.useColors = function() {
                    if ("undefined" != typeof window && window.process && ("renderer" === window.process.type || window.process.__nwjs))
                        return !0;
                    if ("undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
                        return !1;
                    return "undefined" != typeof document && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || "undefined" != typeof window && window.console && (window.console.firebug || window.console.exception && window.console.table) || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || "undefined" != typeof navigator && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/)
                }
                ,
                n.storage = function() {
                    try {
                        return localStorage
                    } catch (e) {}
                }(),
                n.destroy = (()=>{
                    let e = !1;
                    return ()=>{
                        e || (e = !0,
                        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."))
                    }
                }
                )(),
                n.colors = ["#0000CC", "#0000FF", "#0033CC", "#0033FF", "#0066CC", "#0066FF", "#0099CC", "#0099FF", "#00CC00", "#00CC33", "#00CC66", "#00CC99", "#00CCCC", "#00CCFF", "#3300CC", "#3300FF", "#3333CC", "#3333FF", "#3366CC", "#3366FF", "#3399CC", "#3399FF", "#33CC00", "#33CC33", "#33CC66", "#33CC99", "#33CCCC", "#33CCFF", "#6600CC", "#6600FF", "#6633CC", "#6633FF", "#66CC00", "#66CC33", "#9900CC", "#9900FF", "#9933CC", "#9933FF", "#99CC00", "#99CC33", "#CC0000", "#CC0033", "#CC0066", "#CC0099", "#CC00CC", "#CC00FF", "#CC3300", "#CC3333", "#CC3366", "#CC3399", "#CC33CC", "#CC33FF", "#CC6600", "#CC6633", "#CC9900", "#CC9933", "#CCCC00", "#CCCC33", "#FF0000", "#FF0033", "#FF0066", "#FF0099", "#FF00CC", "#FF00FF", "#FF3300", "#FF3333", "#FF3366", "#FF3399", "#FF33CC", "#FF33FF", "#FF6600", "#FF6633", "#FF9900", "#FF9933", "#FFCC00", "#FFCC33"],
                n.log = console.debug || console.log || (()=>{}
                ),
                t.exports = e("./common")(n);
                const {formatters: i} = t.exports;
                i.j = function(e) {
                    try {
                        return JSON.stringify(e)
                    } catch (e) {
                        return "[UnexpectedJSONParseError]: " + e.message
                    }
                }
            }
            ).call(this)
        }
        ).call(this, e("_process"))
    }
    , {
        "./common": 16,
        _process: 23
    }],
    events: [function(e, t, n) {
        "use strict";
        var r, i = "object" == typeof Reflect ? Reflect : null, s = i && "function" == typeof i.apply ? i.apply : function(e, t, n) {
            return Function.prototype.apply.call(e, t, n)
        }
        ;
        r = i && "function" == typeof i.ownKeys ? i.ownKeys : Object.getOwnPropertySymbols ? function(e) {
            return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))
        }
        : function(e) {
            return Object.getOwnPropertyNames(e)
        }
        ;
        var o = Number.isNaN || function(e) {
            return e != e
        }
        ;
        function a() {
            a.init.call(this)
        }
        t.exports = a,
        t.exports.once = function(e, t) {
            return new Promise((function(n, r) {
                function i(n) {
                    e.removeListener(t, s),
                    r(n)
                }
                function s() {
                    "function" == typeof e.removeListener && e.removeListener("error", i),
                    n([].slice.call(arguments))
                }
                y(e, t, s, {
                    once: !0
                }),
                "error" !== t && function(e, t, n) {
                    "function" == typeof e.on && y(e, "error", t, n)
                }(e, i, {
                    once: !0
                })
            }
            ))
        }
        ,
        a.EventEmitter = a,
        a.prototype._events = void 0,
        a.prototype._eventsCount = 0,
        a.prototype._maxListeners = void 0;
        var h = 10;
        function u(e) {
            if ("function" != typeof e)
                throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof e)
        }
        function c(e) {
            return void 0 === e._maxListeners ? a.defaultMaxListeners : e._maxListeners
        }
        function l(e, t, n, r) {
            var i, s, o, a;
            if (u(n),
            void 0 === (s = e._events) ? (s = e._events = Object.create(null),
            e._eventsCount = 0) : (void 0 !== s.newListener && (e.emit("newListener", t, n.listener ? n.listener : n),
            s = e._events),
            o = s[t]),
            void 0 === o)
                o = s[t] = n,
                ++e._eventsCount;
            else if ("function" == typeof o ? o = s[t] = r ? [n, o] : [o, n] : r ? o.unshift(n) : o.push(n),
            (i = c(e)) > 0 && o.length > i && !o.warned) {
                o.warned = !0;
                var h = new Error("Possible EventEmitter memory leak detected. " + o.length + " " + String(t) + " listeners added. Use emitter.setMaxListeners() to increase limit");
                h.name = "MaxListenersExceededWarning",
                h.emitter = e,
                h.type = t,
                h.count = o.length,
                a = h,
                console && console.warn && console.warn(a)
            }
            return e
        }
        function d() {
            if (!this.fired)
                return this.target.removeListener(this.type, this.wrapFn),
                this.fired = !0,
                0 === arguments.length ? this.listener.call(this.target) : this.listener.apply(this.target, arguments)
        }
        function f(e, t, n) {
            var r = {
                fired: !1,
                wrapFn: void 0,
                target: e,
                type: t,
                listener: n
            }
              , i = d.bind(r);
            return i.listener = n,
            r.wrapFn = i,
            i
        }
        function p(e, t, n) {
            var r = e._events;
            if (void 0 === r)
                return [];
            var i = r[t];
            return void 0 === i ? [] : "function" == typeof i ? n ? [i.listener || i] : [i] : n ? function(e) {
                for (var t = new Array(e.length), n = 0; n < t.length; ++n)
                    t[n] = e[n].listener || e[n];
                return t
            }(i) : m(i, i.length)
        }
        function g(e) {
            var t = this._events;
            if (void 0 !== t) {
                var n = t[e];
                if ("function" == typeof n)
                    return 1;
                if (void 0 !== n)
                    return n.length
            }
            return 0
        }
        function m(e, t) {
            for (var n = new Array(t), r = 0; r < t; ++r)
                n[r] = e[r];
            return n
        }
        function y(e, t, n, r) {
            if ("function" == typeof e.on)
                r.once ? e.once(t, n) : e.on(t, n);
            else {
                if ("function" != typeof e.addEventListener)
                    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof e);
                e.addEventListener(t, (function i(s) {
                    r.once && e.removeEventListener(t, i),
                    n(s)
                }
                ))
            }
        }
        Object.defineProperty(a, "defaultMaxListeners", {
            enumerable: !0,
            get: function() {
                return h
            },
            set: function(e) {
                if ("number" != typeof e || e < 0 || o(e))
                    throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + e + ".");
                h = e
            }
        }),
        a.init = function() {
            void 0 !== this._events && this._events !== Object.getPrototypeOf(this)._events || (this._events = Object.create(null),
            this._eventsCount = 0),
            this._maxListeners = this._maxListeners || void 0
        }
        ,
        a.prototype.setMaxListeners = function(e) {
            if ("number" != typeof e || e < 0 || o(e))
                throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
            return this._maxListeners = e,
            this
        }
        ,
        a.prototype.getMaxListeners = function() {
            return c(this)
        }
        ,
        a.prototype.emit = function(e) {
            for (var t = [], n = 1; n < arguments.length; n++)
                t.push(arguments[n]);
            var r = "error" === e
              , i = this._events;
            if (void 0 !== i)
                r = r && void 0 === i.error;
            else if (!r)
                return !1;
            if (r) {
                var o;
                if (t.length > 0 && (o = t[0]),
                o instanceof Error)
                    throw o;
                var a = new Error("Unhandled error." + (o ? " (" + o.message + ")" : ""));
                throw a.context = o,
                a
            }
            var h = i[e];
            if (void 0 === h)
                return !1;
            if ("function" == typeof h)
                s(h, this, t);
            else {
                var u = h.length
                  , c = m(h, u);
                for (n = 0; n < u; ++n)
                    s(c[n], this, t)
            }
            return !0
        }
        ,
        a.prototype.addListener = function(e, t) {
            return l(this, e, t, !1)
        }
        ,
        a.prototype.on = a.prototype.addListener,
        a.prototype.prependListener = function(e, t) {
            return l(this, e, t, !0)
        }
        ,
        a.prototype.once = function(e, t) {
            return u(t),
            this.on(e, f(this, e, t)),
            this
        }
        ,
        a.prototype.prependOnceListener = function(e, t) {
            return u(t),
            this.prependListener(e, f(this, e, t)),
            this
        }
        ,
        a.prototype.removeListener = function(e, t) {
            var n, r, i, s, o;
            if (u(t),
            void 0 === (r = this._events))
                return this;
            if (void 0 === (n = r[e]))
                return this;
            if (n === t || n.listener === t)
                0 == --this._eventsCount ? this._events = Object.create(null) : (delete r[e],
                r.removeListener && this.emit("removeListener", e, n.listener || t));
            else if ("function" != typeof n) {
                for (i = -1,
                s = n.length - 1; s >= 0; s--)
                    if (n[s] === t || n[s].listener === t) {
                        o = n[s].listener,
                        i = s;
                        break
                    }
                if (i < 0)
                    return this;
                0 === i ? n.shift() : function(e, t) {
                    for (; t + 1 < e.length; t++)
                        e[t] = e[t + 1];
                    e.pop()
                }(n, i),
                1 === n.length && (r[e] = n[0]),
                void 0 !== r.removeListener && this.emit("removeListener", e, o || t)
            }
            return this
        }
        ,
        a.prototype.off = a.prototype.removeListener,
        a.prototype.removeAllListeners = function(e) {
            var t, n, r;
            if (void 0 === (n = this._events))
                return this;
            if (void 0 === n.removeListener)
                return 0 === arguments.length ? (this._events = Object.create(null),
                this._eventsCount = 0) : void 0 !== n[e] && (0 == --this._eventsCount ? this._events = Object.create(null) : delete n[e]),
                this;
            if (0 === arguments.length) {
                var i, s = Object.keys(n);
                for (r = 0; r < s.length; ++r)
                    "removeListener" !== (i = s[r]) && this.removeAllListeners(i);
                return this.removeAllListeners("removeListener"),
                this._events = Object.create(null),
                this._eventsCount = 0,
                this
            }
            if ("function" == typeof (t = n[e]))
                this.removeListener(e, t);
            else if (void 0 !== t)
                for (r = t.length - 1; r >= 0; r--)
                    this.removeListener(e, t[r]);
            return this
        }
        ,
        a.prototype.listeners = function(e) {
            return p(this, e, !0)
        }
        ,
        a.prototype.rawListeners = function(e) {
            return p(this, e, !1)
        }
        ,
        a.listenerCount = function(e, t) {
            return "function" == typeof e.listenerCount ? e.listenerCount(t) : g.call(e, t)
        }
        ,
        a.prototype.listenerCount = g,
        a.prototype.eventNames = function() {
            return this._eventsCount > 0 ? r(this._events) : []
        }
    }
    , {}],
    "p2p-media-loader-core": [function(e, t, n) {
        "use strict";
        var r = this && this.__createBinding || (Object.create ? function(e, t, n, r) {
            void 0 === r && (r = n),
            Object.defineProperty(e, r, {
                enumerable: !0,
                get: function() {
                    return t[n]
                }
            })
        }
        : function(e, t, n, r) {
            void 0 === r && (r = n),
            e[r] = t[n]
        }
        )
          , i = this && this.__exportStar || function(e, t) {
            for (var n in e)
                "default" === n || Object.prototype.hasOwnProperty.call(t, n) || r(t, e, n)
        }
        ;
        Object.defineProperty(n, "__esModule", {
            value: !0
        }),
        n.version = void 0,
        n.version = "0.6.2",
        i(e("./loader-interface"), n),
        i(e("./hybrid-loader"), n)
    }
    , {
        "./hybrid-loader": 4,
        "./loader-interface": 5
    }]
}, {}, [2]);
require = function t(e, s, i) {
    function r(n, o) {
        if (!s[n]) {
            if (!e[n]) {
                var u = "function" == typeof require && require;
                if (!o && u)
                    return u(n, !0);
                if (a)
                    return a(n, !0);
                var l = new Error("Cannot find module '" + n + "'");
                throw l.code = "MODULE_NOT_FOUND",
                l
            }
            var g = s[n] = {
                exports: {}
            };
            e[n][0].call(g.exports, (function(t) {
                return r(e[n][1][t] || t)
            }
            ), g, g.exports, t, e, s, i)
        }
        return s[n].exports
    }
    for (var a = "function" == typeof require && require, n = 0; n < i.length; n++)
        r(i[n]);
    return r
}({
    1: [function(t, e, s) {
        "use strict";
        var i = this && this.__createBinding || (Object.create ? function(t, e, s, i) {
            void 0 === i && (i = s),
            Object.defineProperty(t, i, {
                enumerable: !0,
                get: function() {
                    return e[s]
                }
            })
        }
        : function(t, e, s, i) {
            void 0 === i && (i = s),
            t[i] = e[s]
        }
        )
          , r = this && this.__setModuleDefault || (Object.create ? function(t, e) {
            Object.defineProperty(t, "default", {
                enumerable: !0,
                value: e
            })
        }
        : function(t, e) {
            t.default = e
        }
        )
          , a = this && this.__importStar || function(t) {
            if (t && t.__esModule)
                return t;
            var e = {};
            if (null != t)
                for (var s in t)
                    "default" !== s && Object.prototype.hasOwnProperty.call(t, s) && i(e, t, s);
            return r(e, t),
            e
        }
        ;
        Object.defineProperty(s, "__esModule", {
            value: !0
        });
        const n = a(t("./index"));
        window.p2pml || (window.p2pml = {}),
        window.p2pml.hlsjs = n
    }
    , {
        "./index": "p2p-media-loader-hlsjs"
    }],
    2: [function(t, e, s) {
        "use strict";
        Object.defineProperty(s, "__esModule", {
            value: !0
        }),
        s.Engine = void 0;
        const i = t("events")
          , r = t("p2p-media-loader-core")
          , a = t("./segment-manager")
          , n = t("./hlsjs-loader");
        class o extends i.EventEmitter {
            constructor(t={}) {
                super(),
                this.loader = new r.HybridLoader(t.loader),
                this.segmentManager = new a.SegmentManager(this.loader,t.segments),
                Object.keys(r.Events).map((t=>r.Events[t])).forEach((t=>this.loader.on(t, ((...e)=>this.emit(t, ...e)))))
            }
            static isSupported() {
                return r.HybridLoader.isSupported()
            }
            createLoaderClass() {
                var t;
                const e = this;
                return (t = class {
                    constructor() {
                        this.load = async(t,e,s)=>{
                            this.context = t,
                            this.callbacks = s,
                            await this.impl.load(t, e, s)
                        }
                        ,
                        this.abort = ()=>{
                            this.context && this.impl.abort(this.context, this.callbacks)
                        }
                        ,
                        this.destroy = ()=>{
                            this.context && this.impl.abort(this.context)
                        }
                        ,
                        this.getResponseHeader = ()=>{}
                        ,
                        this.impl = new n.HlsJsLoader(e.segmentManager),
                        this.stats = this.impl.stats
                    }
                }
                ).getEngine = ()=>e,
                t
            }
            async destroy() {
                await this.segmentManager.destroy()
            }
            getSettings() {
                return {
                    segments: this.segmentManager.getSettings(),
                    loader: this.loader.getSettings()
                }
            }
            getDetails() {
                return {
                    loader: this.loader.getDetails()
                }
            }
            setPlayingSegment(t, e, s, i) {
                this.segmentManager.setPlayingSegment(t, e, s, i)
            }
            setPlayingSegmentByCurrentTime(t) {
                this.segmentManager.setPlayingSegmentByCurrentTime(t)
            }
        }
        s.Engine = o
    }
    , {
        "./hlsjs-loader": 3,
        "./segment-manager": 4,
        events: "events",
        "p2p-media-loader-core": "p2p-media-loader-core"
    }],
    3: [function(t, e, s) {
        "use strict";
        Object.defineProperty(s, "__esModule", {
            value: !0
        }),
        s.HlsJsLoader = void 0;
        const i = t("p2p-media-loader-core");
        function r(t) {
            t.loading.start = t.trequest,
            t.loading.first = t.tfirst,
            t.loading.end = t.tload
        }
        function a(t) {
            return t.rangeEnd && void 0 !== t.rangeStart ? {
                offset: t.rangeStart,
                length: t.rangeEnd - t.rangeStart
            } : void 0
        }
        s.HlsJsLoader = class {
            constructor(t) {
                this.isLoaded = !1,
                this.stats = {
                    trequest: 0,
                    tfirst: 0,
                    tload: 0,
                    tparsed: 0,
                    loaded: 0,
                    total: 0,
                    aborted: !1,
                    retry: 0,
                    chunkCount: 0,
                    bwEstimate: 0,
                    loading: {
                        start: 0,
                        end: 0,
                        first: 0
                    },
                    parsing: {
                        start: 0,
                        end: 0
                    },
                    buffering: {
                        start: 0,
                        end: 0,
                        first: 0
                    }
                },
                this.segmentManager = t
            }
            async load(t, e, s) {
                const r = performance.now();
                if (this.stats.loading.start = r - 1,
                this.stats.loading.first = r,
                t.type)
                    try {
                        const e = await this.segmentManager.loadPlaylist(t.url);
                        this.isLoaded = !0,
                        this.successPlaylist(e, t, s)
                    } catch (e) {
                        this.error(e, t, s)
                    }
                else if (t.frag) {
                    const {loader: e} = this.segmentManager
                      , n = ()=>{
                        const t = e.getBandwidthEstimate();
                        this.stats.bwEstimate = 8e3 * t,
                        this.stats.loaded = (performance.now() - r) * t
                    }
                    ;
                    e.on(i.Events.PieceBytesDownloaded, n);
                    try {
                        const r = await this.segmentManager.loadSegment(t.url, a(t))
                          , {content: o} = r;
                        o && (this.isLoaded = !0,
                        setTimeout((()=>this.successSegment(o, r.downloadBandwidth, t, s)), 0))
                    } catch (e) {
                        setTimeout((()=>this.error(e, t, s)), 0)
                    } finally {
                        e.removeListener(i.Events.PieceBytesDownloaded, n)
                    }
                } else
                    console.warn("Unknown load request", t)
            }
            abort(t, e) {
                if (this.isLoaded)
                    return;
                this.segmentManager.abortSegment(t.url, a(t)),
                this.stats.aborted = !0;
                const s = null == e ? void 0 : e.onAbort;
                s && s(this.stats, t, void 0)
            }
            successPlaylist(t, e, s) {
                const i = performance.now();
                this.stats.trequest = i - 300,
                this.stats.tfirst = i - 200,
                this.stats.tload = i - 1,
                this.stats.loaded = t.response.length,
                this.stats.total = t.response.length,
                r(this.stats),
                s.onSuccess({
                    url: t.responseURL,
                    data: t.response
                }, this.stats, e, void 0)
            }
            successSegment(t, e, s, i) {
                const a = performance.now()
                  , n = t.byteLength / (void 0 === e || e <= 0 ? 12500 : e);
                this.stats.trequest = a - 1 - n,
                this.stats.tfirst = a - n,
                this.stats.tload = a - 1,
                this.stats.loaded = t.byteLength,
                this.stats.total = t.byteLength,
                this.stats.bwEstimate = 8e3 * (null != e ? e : 12500),
                r(this.stats),
                i.onProgress && i.onProgress(this.stats, s, t, void 0),
                i.onSuccess({
                    url: s.url,
                    data: t
                }, this.stats, s, void 0)
            }
            error(t, e, s) {
                s.onError(t, e, void 0)
            }
        }
    }
    , {
        "p2p-media-loader-core": "p2p-media-loader-core"
    }],
    4: [function(t, e, s) {
        "use strict";
        Object.defineProperty(s, "__esModule", {
            value: !0
        }),
        s.SegmentManager = void 0;
        const i = t("p2p-media-loader-core")
          , r = t("m3u8-parser")
          , a = {
            forwardSegmentCount: 20,
            swarmId: void 0,
            assetsStorage: void 0
        };
        s.SegmentManager = class {
            constructor(t, e={}) {
                this.masterPlaylist = null,
                this.variantPlaylists = new Map,
                this.segmentRequest = null,
                this.playQueue = [],
                this.onSegmentLoaded = t=>{
                    this.segmentRequest && this.segmentRequest.segmentUrl === t.url && l(this.segmentRequest.segmentByteRange) === t.range && (this.segmentRequest.onSuccess(t.data.slice(0), t.downloadBandwidth),
                    this.segmentRequest = null)
                }
                ,
                this.onSegmentError = (t,e)=>{
                    this.segmentRequest && this.segmentRequest.segmentUrl === t.url && l(this.segmentRequest.segmentByteRange) === t.range && (this.segmentRequest.onError(e),
                    this.segmentRequest = null)
                }
                ,
                this.onSegmentAbort = t=>{
                    this.segmentRequest && this.segmentRequest.segmentUrl === t.url && l(this.segmentRequest.segmentByteRange) === t.range && (this.segmentRequest.onError("Loading aborted: internal abort"),
                    this.segmentRequest = null)
                }
                ,
                this.settings = Object.assign(Object.assign({}, a), e),
                this.loader = t,
                this.loader.on(i.Events.SegmentLoaded, this.onSegmentLoaded),
                this.loader.on(i.Events.SegmentError, this.onSegmentError),
                this.loader.on(i.Events.SegmentAbort, this.onSegmentAbort)
            }
            getSettings() {
                return this.settings
            }
            processPlaylist(t, e, s) {
                const i = new r.Parser;
                i.push(e),
                i.end();
                const a = new n(t,s,i.manifest);
                if (a.manifest.playlists) {
                    this.masterPlaylist = a;
                    for (const [t,e] of this.variantPlaylists) {
                        const {streamSwarmId: s, found: i, index: r} = this.getStreamSwarmId(e.requestUrl);
                        if (i) {
                            let t;
                            t = e.requestUrl.match(/-sa([0-9])+-/),
                            t = null != t ? t[1] : 0,
                            e.streamSwarmId = s,
                            e.streamId = "V" + r.toString() + "+A" + t
                        } else
                            this.variantPlaylists.delete(t)
                    }
                } else {
                    const {streamSwarmId: e, found: s, index: i} = this.getStreamSwarmId(t);
                    if (s || null === this.masterPlaylist) {
                        let s;
                        s = a.requestUrl.match(/-sa([0-9])+-/),
                        s = null != s ? s[1] : 0,
                        a.streamSwarmId = e,
                        a.streamId = null === this.masterPlaylist ? void 0 : "V" + i.toString() + "+A" + s,
                        this.variantPlaylists.set(t, a),
                        this.updateSegments()
                    }
                }
            }
            async loadPlaylist(t) {
                const e = this.settings.assetsStorage;
                let s;
                if (void 0 !== e) {
                    let i;
                    i = this.getMasterSwarmId(),
                    void 0 === i && (i = t.split("?")[0]);
                    const r = await e.getAsset(t, void 0, i);
                    void 0 !== r ? s = {
                        responseURL: r.responseUri,
                        response: r.data
                    } : (s = await this.loadContent(t, "text"),
                    e.storeAsset({
                        masterManifestUri: null !== this.masterPlaylist ? this.masterPlaylist.requestUrl : t,
                        masterSwarmId: i,
                        requestUri: t,
                        responseUri: s.responseURL,
                        data: s.response
                    }))
                } else
                    s = await this.loadContent(t, "text");
                return this.processPlaylist(t, s.response, s.responseURL),
                s
            }
            async loadSegment(t, e) {
                var s;
                const i = this.getSegmentLocation(t, e)
                  , r = l(e);
                if (!i) {
                    let e;
                    const i = this.settings.assetsStorage;
                    if (void 0 !== i) {
                        let a, n = null === (s = this.masterPlaylist) || void 0 === s ? void 0 : s.requestUrl;
                        if (a = this.getMasterSwarmId(),
                        void 0 === a && 1 === this.variantPlaylists.size) {
                            const t = this.variantPlaylists.values().next();
                            t.done || (a = t.value.requestUrl.split("?")[0])
                        }
                        if (void 0 === n && 1 === this.variantPlaylists.size) {
                            const t = this.variantPlaylists.values().next();
                            t.done || (n = t.value.requestUrl)
                        }
                        if (void 0 !== a && void 0 !== n) {
                            const s = await i.getAsset(t, r, a);
                            if (void 0 !== s)
                                e = s.data;
                            else {
                                const s = await this.loadContent(t, "arraybuffer", r);
                                e = s.response,
                                i.storeAsset({
                                    masterManifestUri: n,
                                    masterSwarmId: a,
                                    requestUri: t,
                                    requestRange: r,
                                    responseUri: s.responseURL,
                                    data: e
                                })
                            }
                        }
                    }
                    if (void 0 === e) {
                        e = (await this.loadContent(t, "arraybuffer", r)).response
                    }
                    return {
                        content: e,
                        downloadBandwidth: 0
                    }
                }
                const a = (i.playlist.manifest.mediaSequence ? i.playlist.manifest.mediaSequence : 0) + i.segmentIndex;
                if (this.playQueue.length > 0) {
                    this.playQueue[this.playQueue.length - 1].segmentSequence !== a - 1 && (this.playQueue = [])
                }
                this.segmentRequest && this.segmentRequest.onError("Cancel segment request: simultaneous segment requests are not supported");
                const n = new Promise(((s,r)=>{
                    this.segmentRequest = new o(t,e,a,i.playlist.requestUrl,((t,e)=>s({
                        content: t,
                        downloadBandwidth: e
                    })),(t=>r(t)))
                }
                ));
                return this.playQueue.push({
                    segmentUrl: t,
                    segmentByteRange: e,
                    segmentSequence: a
                }),
                this.loadSegments(i.playlist, i.segmentIndex, !0),
                n
            }
            setPlayingSegment(t, e, s, i) {
                const r = this.playQueue.findIndex((s=>s.segmentUrl === t && u(s.segmentByteRange, e)));
                r >= 0 && (this.playQueue = this.playQueue.slice(r),
                this.playQueue[0].playPosition = {
                    start: s,
                    duration: i
                },
                this.updateSegments())
            }
            setPlayingSegmentByCurrentTime(t) {
                if (0 === this.playQueue.length || !this.playQueue[0].playPosition)
                    return;
                const e = this.playQueue[0].playPosition;
                e.start + e.duration - t < .2 && (this.playQueue = this.playQueue.slice(1),
                this.updateSegments())
            }
            abortSegment(t, e) {
                this.segmentRequest && this.segmentRequest.segmentUrl === t && u(this.segmentRequest.segmentByteRange, e) && (this.segmentRequest.onSuccess(void 0, 0),
                this.segmentRequest = null)
            }
            async destroy() {
                this.segmentRequest && (this.segmentRequest.onError("Loading aborted: object destroyed"),
                this.segmentRequest = null),
                this.masterPlaylist = null,
                this.variantPlaylists.clear(),
                this.playQueue = [],
                void 0 !== this.settings.assetsStorage && await this.settings.assetsStorage.destroy(),
                await this.loader.destroy()
            }
            updateSegments() {
                if (!this.segmentRequest)
                    return;
                const t = this.getSegmentLocation(this.segmentRequest.segmentUrl, this.segmentRequest.segmentByteRange);
                t && this.loadSegments(t.playlist, t.segmentIndex, !1)
            }
            getSegmentLocation(t, e) {
                for (const s of this.variantPlaylists.values()) {
                    const i = s.getSegmentIndex(t, e);
                    if (i >= 0)
                        return {
                            playlist: s,
                            segmentIndex: i
                        }
                }
            }
            async loadSegments(t, e, s) {
                var i;
                const r = []
                  , a = t.manifest.segments
                  , n = null !== (i = t.manifest.mediaSequence) && void 0 !== i ? i : 0;
                let o = null
                  , u = Math.max(0, this.playQueue.length - 1);
                const g = this.getMasterSwarmId();
                for (let i = e; i < a.length && r.length < this.settings.forwardSegmentCount; ++i) {
                    const e = t.manifest.segments[i]
                      , a = t.getSegmentAbsoluteUrl(e.uri)
                      , d = e.byterange
                      , c = this.getSegmentId(t, n + i);
                    r.push({
                        id: c,
                        url: a,
                        masterSwarmId: void 0 !== g ? g : t.streamSwarmId,
                        masterManifestUri: null !== this.masterPlaylist ? this.masterPlaylist.requestUrl : t.requestUrl,
                        streamId: t.streamId,
                        sequence: (n + i).toString(),
                        range: l(d),
                        priority: u++
                    }),
                    s && !o && (o = c)
                }
                if (this.loader.load(r, t.streamSwarmId),
                o) {
                    const t = await this.loader.getSegment(o);
                    t && this.onSegmentLoaded(t)
                }
            }
            getSegmentId(t, e) {
                return `${t.streamSwarmId}+${e}`
            }
            getMasterSwarmId() {
                const t = this.settings.swarmId && 0 !== this.settings.swarmId.length ? this.settings.swarmId : void 0;
                return void 0 !== t ? t : null !== this.masterPlaylist ? this.masterPlaylist.requestUrl.split("?")[0] : void 0
            }
            getStreamSwarmId(t) {
                var e;
                const s = this.getMasterSwarmId();
                var i = null;
                if (this.masterPlaylist && this.masterPlaylist.manifest.playlists && s)
                    for (let e = 0; e < this.masterPlaylist.manifest.playlists.length; ++e) {
                        if (new URL(this.masterPlaylist.manifest.playlists[e].uri,this.masterPlaylist.responseUrl).toString() === t)
                            return {
                                streamSwarmId: `${s}+V${e}+A${i = null != (i = t.match(/-sa([0-9])+-/)) ? i[1] : 0}`,
                                found: !0,
                                index: e
                            }
                    }
                return {
                    streamSwarmId: null !== (e = `${s}+A${i = null != (i = t.match(/-sa([0-9])+-/)) ? i[1] : 0}`) && void 0 !== e ? e : t.split("?")[0],
                    found: !1,
                    index: -1
                }
            }
            async loadContent(t, e, s) {
                return new Promise(((i,r)=>{
                    console.log("CHJS: XMLHttpRequest NO1: " + t)
                    var _x = ""
                    const tr = new URL(t)
                    const a = new XMLHttpRequest;
                    a.open("GET", t, !0),
                    a.responseType = e,
                    s && a.setRequestHeader("Range", s),
                    a.addEventListener("readystatechange", (()=>{
                        4 === a.readyState && (a.status >= 200 && a.status < 300 ? i(a) : r(a.statusText))
                    }
                    ));
                    const n = this.loader.getSettings().xhrSetup;
                    n && n(a, t),
                    a.send()
                }
                ))
            }
        }
        ;
        class n {
            constructor(t, e, s) {
                this.requestUrl = t,
                this.responseUrl = e,
                this.manifest = s,
                this.streamSwarmId = ""
            }
            getSegmentIndex(t, e) {
                for (let s = 0; s < this.manifest.segments.length; ++s) {
                    const i = this.manifest.segments[s];
                    if (t === this.getSegmentAbsoluteUrl(i.uri) && u(i.byterange, e))
                        return s
                }
                return -1
            }
            getSegmentAbsoluteUrl(t) {
                return new URL(t,this.responseUrl).toString()
            }
        }
        class o {
            constructor(t, e, s, i, r, a) {
                this.segmentUrl = t,
                this.segmentByteRange = e,
                this.segmentSequence = s,
                this.playlistRequestUrl = i,
                this.onSuccess = r,
                this.onError = a
            }
        }
        function u(t, e) {
            return void 0 === t ? void 0 === e : void 0 !== e && t.length === e.length && t.offset === e.offset
        }
        function l(t) {
            if (void 0 === t)
                return;
            const e = t.offset + t.length - 1;
            return `bytes=${t.offset}-${e}`
        }
    }
    , {
        "m3u8-parser": 13,
        "p2p-media-loader-core": "p2p-media-loader-core"
    }],
    5: [function(t, e, s) {
        e.exports = function(t) {
            if (void 0 === t)
                throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }
        ,
        e.exports.default = e.exports,
        e.exports.__esModule = !0
    }
    , {}],
    6: [function(t, e, s) {
        function i() {
            return e.exports = i = Object.assign || function(t) {
                for (var e = 1; e < arguments.length; e++) {
                    var s = arguments[e];
                    for (var i in s)
                        Object.prototype.hasOwnProperty.call(s, i) && (t[i] = s[i])
                }
                return t
            }
            ,
            e.exports.default = e.exports,
            e.exports.__esModule = !0,
            i.apply(this, arguments)
        }
        e.exports = i,
        e.exports.default = e.exports,
        e.exports.__esModule = !0
    }
    , {}],
    7: [function(t, e, s) {
        var i = t("./setPrototypeOf.js");
        e.exports = function(t, e) {
            t.prototype = Object.create(e.prototype),
            t.prototype.constructor = t,
            i(t, e)
        }
        ,
        e.exports.default = e.exports,
        e.exports.__esModule = !0
    }
    , {
        "./setPrototypeOf.js": 9
    }],
    8: [function(t, e, s) {
        e.exports = function(t) {
            return t && t.__esModule ? t : {
                default: t
            }
        }
        ,
        e.exports.default = e.exports,
        e.exports.__esModule = !0
    }
    , {}],
    9: [function(t, e, s) {
        function i(t, s) {
            return e.exports = i = Object.setPrototypeOf || function(t, e) {
                return t.__proto__ = e,
                t
            }
            ,
            e.exports.default = e.exports,
            e.exports.__esModule = !0,
            i(t, s)
        }
        e.exports = i,
        e.exports.default = e.exports,
        e.exports.__esModule = !0
    }
    , {}],
    10: [function(t, e, s) {
        (function(i) {
            (function() {
                "use strict";
                var r = t("@babel/runtime/helpers/interopRequireDefault");
                Object.defineProperty(s, "__esModule", {
                    value: !0
                }),
                s.default = function(t) {
                    for (var e = (n = t,
                    a.default.atob ? a.default.atob(n) : i.from(n, "base64").toString("binary")), s = new Uint8Array(e.length), r = 0; r < e.length; r++)
                        s[r] = e.charCodeAt(r);
                    var n;
                    return s
                }
                ;
                var a = r(t("global/window"));
                e.exports = s.default
            }
            ).call(this)
        }
        ).call(this, t("buffer").Buffer)
    }
    , {
        "@babel/runtime/helpers/interopRequireDefault": 8,
        buffer: "buffer",
        "global/window": 12
    }],
    11: [function(t, e, s) {
        "use strict";
        Object.defineProperty(s, "__esModule", {
            value: !0
        }),
        s.default = void 0;
        var i = function() {
            function t() {
                this.listeners = {}
            }
            var e = t.prototype;
            return e.on = function(t, e) {
                this.listeners[t] || (this.listeners[t] = []),
                this.listeners[t].push(e)
            }
            ,
            e.off = function(t, e) {
                if (!this.listeners[t])
                    return !1;
                var s = this.listeners[t].indexOf(e);
                return this.listeners[t] = this.listeners[t].slice(0),
                this.listeners[t].splice(s, 1),
                s > -1
            }
            ,
            e.trigger = function(t) {
                var e = this.listeners[t];
                if (e)
                    if (2 === arguments.length)
                        for (var s = e.length, i = 0; i < s; ++i)
                            e[i].call(this, arguments[1]);
                    else
                        for (var r = Array.prototype.slice.call(arguments, 1), a = e.length, n = 0; n < a; ++n)
                            e[n].apply(this, r)
            }
            ,
            e.dispose = function() {
                this.listeners = {}
            }
            ,
            e.pipe = function(t) {
                this.on("data", (function(e) {
                    t.push(e)
                }
                ))
            }
            ,
            t
        }();
        s.default = i,
        e.exports = s.default
    }
    , {}],
    12: [function(t, e, s) {
        (function(t) {
            (function() {
                var s;
                s = "undefined" != typeof window ? window : void 0 !== t ? t : "undefined" != typeof self ? self : {},
                e.exports = s
            }
            ).call(this)
        }
        ).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
    }
    , {}],
    13: [function(t, e, s) {
        "use strict";
        Object.defineProperty(s, "__esModule", {
            value: !0
        });
        var i = t("@babel/runtime/helpers/inheritsLoose")
          , r = t("@videojs/vhs-utils/cjs/stream.js")
          , a = t("@babel/runtime/helpers/extends")
          , n = t("@babel/runtime/helpers/assertThisInitialized")
          , o = t("@videojs/vhs-utils/cjs/decode-b64-to-uint8-array.js");
        function u(t) {
            return t && "object" == typeof t && "default"in t ? t : {
                default: t
            }
        }
        var l = u(i)
          , g = u(r)
          , d = u(a)
          , c = u(n)
          , f = u(o)
          , h = function(t) {
            function e() {
                var e;
                return (e = t.call(this) || this).buffer = "",
                e
            }
            return l.default(e, t),
            e.prototype.push = function(t) {
                var e;
                for (this.buffer += t,
                e = this.buffer.indexOf("\n"); e > -1; e = this.buffer.indexOf("\n"))
                    this.trigger("data", this.buffer.substring(0, e)),
                    this.buffer = this.buffer.substring(e + 1)
            }
            ,
            e
        }(g.default)
          , p = String.fromCharCode(9)
          , m = function(t) {
            var e = /([0-9.]*)?@?([0-9.]*)?/.exec(t || "")
              , s = {};
            return e[1] && (s.length = parseInt(e[1], 10)),
            e[2] && (s.offset = parseInt(e[2], 10)),
            s
        }
          , y = function(t) {
            for (var e, s = t.split(new RegExp('(?:^|,)((?:[^=]*)=(?:"[^"]*"|[^,]*))')), i = {}, r = s.length; r--; )
                "" !== s[r] && ((e = /([^=]*)=(.*)/.exec(s[r]).slice(1))[0] = e[0].replace(/^\s+|\s+$/g, ""),
                e[1] = e[1].replace(/^\s+|\s+$/g, ""),
                e[1] = e[1].replace(/^['"](.*)['"]$/g, "$1"),
                i[e[0]] = e[1]);
            return i
        }
          , b = function(t) {
            function e() {
                var e;
                return (e = t.call(this) || this).customParsers = [],
                e.tagMappers = [],
                e
            }
            l.default(e, t);
            var s = e.prototype;
            return s.push = function(t) {
                var e, s, i = this;
                0 !== (t = t.trim()).length && ("#" === t[0] ? this.tagMappers.reduce((function(e, s) {
                    var i = s(t);
                    return i === t ? e : e.concat([i])
                }
                ), [t]).forEach((function(t) {
                    for (var r = 0; r < i.customParsers.length; r++)
                        if (i.customParsers[r].call(i, t))
                            return;
                    if (0 === t.indexOf("#EXT"))
                        if (t = t.replace("\r", ""),
                        e = /^#EXTM3U/.exec(t))
                            i.trigger("data", {
                                type: "tag",
                                tagType: "m3u"
                            });
                        else {
                            if (e = /^#EXTINF:?([0-9\.]*)?,?(.*)?$/.exec(t))
                                return s = {
                                    type: "tag",
                                    tagType: "inf"
                                },
                                e[1] && (s.duration = parseFloat(e[1])),
                                e[2] && (s.title = e[2]),
                                void i.trigger("data", s);
                            if (e = /^#EXT-X-TARGETDURATION:?([0-9.]*)?/.exec(t))
                                return s = {
                                    type: "tag",
                                    tagType: "targetduration"
                                },
                                e[1] && (s.duration = parseInt(e[1], 10)),
                                void i.trigger("data", s);
                            if (e = /^#EXT-X-VERSION:?([0-9.]*)?/.exec(t))
                                return s = {
                                    type: "tag",
                                    tagType: "version"
                                },
                                e[1] && (s.version = parseInt(e[1], 10)),
                                void i.trigger("data", s);
                            if (e = /^#EXT-X-MEDIA-SEQUENCE:?(\-?[0-9.]*)?/.exec(t))
                                return s = {
                                    type: "tag",
                                    tagType: "media-sequence"
                                },
                                e[1] && (s.number = parseInt(e[1], 10)),
                                void i.trigger("data", s);
                            if (e = /^#EXT-X-DISCONTINUITY-SEQUENCE:?(\-?[0-9.]*)?/.exec(t))
                                return s = {
                                    type: "tag",
                                    tagType: "discontinuity-sequence"
                                },
                                e[1] && (s.number = parseInt(e[1], 10)),
                                void i.trigger("data", s);
                            if (e = /^#EXT-X-PLAYLIST-TYPE:?(.*)?$/.exec(t))
                                return s = {
                                    type: "tag",
                                    tagType: "playlist-type"
                                },
                                e[1] && (s.playlistType = e[1]),
                                void i.trigger("data", s);
                            if (e = /^#EXT-X-BYTERANGE:?(.*)?$/.exec(t))
                                return s = d.default(m(e[1]), {
                                    type: "tag",
                                    tagType: "byterange"
                                }),
                                void i.trigger("data", s);
                            if (e = /^#EXT-X-ALLOW-CACHE:?(YES|NO)?/.exec(t))
                                return s = {
                                    type: "tag",
                                    tagType: "allow-cache"
                                },
                                e[1] && (s.allowed = !/NO/.test(e[1])),
                                void i.trigger("data", s);
                            if (e = /^#EXT-X-MAP:?(.*)$/.exec(t)) {
                                if (s = {
                                    type: "tag",
                                    tagType: "map"
                                },
                                e[1]) {
                                    var a = y(e[1]);
                                    a.URI && (s.uri = a.URI),
                                    a.BYTERANGE && (s.byterange = m(a.BYTERANGE))
                                }
                                i.trigger("data", s)
                            } else if (e = /^#EXT-X-STREAM-INF:?(.*)$/.exec(t)) {
                                if (s = {
                                    type: "tag",
                                    tagType: "stream-inf"
                                },
                                e[1]) {
                                    if (s.attributes = y(e[1]),
                                    s.attributes.RESOLUTION) {
                                        var n = s.attributes.RESOLUTION.split("x")
                                          , o = {};
                                        n[0] && (o.width = parseInt(n[0], 10)),
                                        n[1] && (o.height = parseInt(n[1], 10)),
                                        s.attributes.RESOLUTION = o
                                    }
                                    s.attributes.BANDWIDTH && (s.attributes.BANDWIDTH = parseInt(s.attributes.BANDWIDTH, 10)),
                                    s.attributes["PROGRAM-ID"] && (s.attributes["PROGRAM-ID"] = parseInt(s.attributes["PROGRAM-ID"], 10))
                                }
                                i.trigger("data", s)
                            } else {
                                if (e = /^#EXT-X-MEDIA:?(.*)$/.exec(t))
                                    return s = {
                                        type: "tag",
                                        tagType: "media"
                                    },
                                    e[1] && (s.attributes = y(e[1])),
                                    void i.trigger("data", s);
                                if (e = /^#EXT-X-ENDLIST/.exec(t))
                                    i.trigger("data", {
                                        type: "tag",
                                        tagType: "endlist"
                                    });
                                else if (e = /^#EXT-X-DISCONTINUITY/.exec(t))
                                    i.trigger("data", {
                                        type: "tag",
                                        tagType: "discontinuity"
                                    });
                                else {
                                    if (e = /^#EXT-X-PROGRAM-DATE-TIME:?(.*)$/.exec(t))
                                        return s = {
                                            type: "tag",
                                            tagType: "program-date-time"
                                        },
                                        e[1] && (s.dateTimeString = e[1],
                                        s.dateTimeObject = new Date(e[1])),
                                        void i.trigger("data", s);
                                    if (e = /^#EXT-X-KEY:?(.*)$/.exec(t))
                                        return s = {
                                            type: "tag",
                                            tagType: "key"
                                        },
                                        e[1] && (s.attributes = y(e[1]),
                                        s.attributes.IV && ("0x" === s.attributes.IV.substring(0, 2).toLowerCase() && (s.attributes.IV = s.attributes.IV.substring(2)),
                                        s.attributes.IV = s.attributes.IV.match(/.{8}/g),
                                        s.attributes.IV[0] = parseInt(s.attributes.IV[0], 16),
                                        s.attributes.IV[1] = parseInt(s.attributes.IV[1], 16),
                                        s.attributes.IV[2] = parseInt(s.attributes.IV[2], 16),
                                        s.attributes.IV[3] = parseInt(s.attributes.IV[3], 16),
                                        s.attributes.IV = new Uint32Array(s.attributes.IV))),
                                        void i.trigger("data", s);
                                    if (e = /^#EXT-X-START:?(.*)$/.exec(t))
                                        return s = {
                                            type: "tag",
                                            tagType: "start"
                                        },
                                        e[1] && (s.attributes = y(e[1]),
                                        s.attributes["TIME-OFFSET"] = parseFloat(s.attributes["TIME-OFFSET"]),
                                        s.attributes.PRECISE = /YES/.test(s.attributes.PRECISE)),
                                        void i.trigger("data", s);
                                    if (e = /^#EXT-X-CUE-OUT-CONT:?(.*)?$/.exec(t))
                                        return s = {
                                            type: "tag",
                                            tagType: "cue-out-cont"
                                        },
                                        e[1] ? s.data = e[1] : s.data = "",
                                        void i.trigger("data", s);
                                    if (e = /^#EXT-X-CUE-OUT:?(.*)?$/.exec(t))
                                        return s = {
                                            type: "tag",
                                            tagType: "cue-out"
                                        },
                                        e[1] ? s.data = e[1] : s.data = "",
                                        void i.trigger("data", s);
                                    if (e = /^#EXT-X-CUE-IN:?(.*)?$/.exec(t))
                                        return s = {
                                            type: "tag",
                                            tagType: "cue-in"
                                        },
                                        e[1] ? s.data = e[1] : s.data = "",
                                        void i.trigger("data", s);
                                    if ((e = /^#EXT-X-SKIP:(.*)$/.exec(t)) && e[1])
                                        return (s = {
                                            type: "tag",
                                            tagType: "skip"
                                        }).attributes = y(e[1]),
                                        s.attributes.hasOwnProperty("SKIPPED-SEGMENTS") && (s.attributes["SKIPPED-SEGMENTS"] = parseInt(s.attributes["SKIPPED-SEGMENTS"], 10)),
                                        s.attributes.hasOwnProperty("RECENTLY-REMOVED-DATERANGES") && (s.attributes["RECENTLY-REMOVED-DATERANGES"] = s.attributes["RECENTLY-REMOVED-DATERANGES"].split(p)),
                                        void i.trigger("data", s);
                                    if ((e = /^#EXT-X-PART:(.*)$/.exec(t)) && e[1])
                                        return (s = {
                                            type: "tag",
                                            tagType: "part"
                                        }).attributes = y(e[1]),
                                        ["DURATION"].forEach((function(t) {
                                            s.attributes.hasOwnProperty(t) && (s.attributes[t] = parseFloat(s.attributes[t]))
                                        }
                                        )),
                                        ["INDEPENDENT", "GAP"].forEach((function(t) {
                                            s.attributes.hasOwnProperty(t) && (s.attributes[t] = /YES/.test(s.attributes[t]))
                                        }
                                        )),
                                        s.attributes.hasOwnProperty("BYTERANGE") && (s.attributes.byterange = m(s.attributes.BYTERANGE)),
                                        void i.trigger("data", s);
                                    if ((e = /^#EXT-X-SERVER-CONTROL:(.*)$/.exec(t)) && e[1])
                                        return (s = {
                                            type: "tag",
                                            tagType: "server-control"
                                        }).attributes = y(e[1]),
                                        ["CAN-SKIP-UNTIL", "PART-HOLD-BACK", "HOLD-BACK"].forEach((function(t) {
                                            s.attributes.hasOwnProperty(t) && (s.attributes[t] = parseFloat(s.attributes[t]))
                                        }
                                        )),
                                        ["CAN-SKIP-DATERANGES", "CAN-BLOCK-RELOAD"].forEach((function(t) {
                                            s.attributes.hasOwnProperty(t) && (s.attributes[t] = /YES/.test(s.attributes[t]))
                                        }
                                        )),
                                        void i.trigger("data", s);
                                    if ((e = /^#EXT-X-PART-INF:(.*)$/.exec(t)) && e[1])
                                        return (s = {
                                            type: "tag",
                                            tagType: "part-inf"
                                        }).attributes = y(e[1]),
                                        ["PART-TARGET"].forEach((function(t) {
                                            s.attributes.hasOwnProperty(t) && (s.attributes[t] = parseFloat(s.attributes[t]))
                                        }
                                        )),
                                        void i.trigger("data", s);
                                    if ((e = /^#EXT-X-PRELOAD-HINT:(.*)$/.exec(t)) && e[1])
                                        return (s = {
                                            type: "tag",
                                            tagType: "preload-hint"
                                        }).attributes = y(e[1]),
                                        ["BYTERANGE-START", "BYTERANGE-LENGTH"].forEach((function(t) {
                                            if (s.attributes.hasOwnProperty(t)) {
                                                s.attributes[t] = parseInt(s.attributes[t], 10);
                                                var e = "BYTERANGE-LENGTH" === t ? "length" : "offset";
                                                s.attributes.byterange = s.attributes.byterange || {},
                                                s.attributes.byterange[e] = s.attributes[t],
                                                delete s.attributes[t]
                                            }
                                        }
                                        )),
                                        void i.trigger("data", s);
                                    if ((e = /^#EXT-X-RENDITION-REPORT:(.*)$/.exec(t)) && e[1])
                                        return (s = {
                                            type: "tag",
                                            tagType: "rendition-report"
                                        }).attributes = y(e[1]),
                                        ["LAST-MSN", "LAST-PART"].forEach((function(t) {
                                            s.attributes.hasOwnProperty(t) && (s.attributes[t] = parseInt(s.attributes[t], 10))
                                        }
                                        )),
                                        void i.trigger("data", s);
                                    i.trigger("data", {
                                        type: "tag",
                                        data: t.slice(4)
                                    })
                                }
                            }
                        }
                    else
                        i.trigger("data", {
                            type: "comment",
                            text: t.slice(1)
                        })
                }
                )) : this.trigger("data", {
                    type: "uri",
                    uri: t
                }))
            }
            ,
            s.addParser = function(t) {
                var e = this
                  , s = t.expression
                  , i = t.customType
                  , r = t.dataParser
                  , a = t.segment;
                "function" != typeof r && (r = function(t) {
                    return t
                }
                ),
                this.customParsers.push((function(t) {
                    if (s.exec(t))
                        return e.trigger("data", {
                            type: "custom",
                            data: r(t),
                            customType: i,
                            segment: a
                        }),
                        !0
                }
                ))
            }
            ,
            s.addTagMapper = function(t) {
                var e = t.expression
                  , s = t.map;
                this.tagMappers.push((function(t) {
                    return e.test(t) ? s(t) : t
                }
                ))
            }
            ,
            e
        }(g.default)
          , E = function(t) {
            var e = {};
            return Object.keys(t).forEach((function(s) {
                var i;
                e[(i = s,
                i.toLowerCase().replace(/-(\w)/g, (function(t) {
                    return t[1].toUpperCase()
                }
                )))] = t[s]
            }
            )),
            e
        }
          , T = function(t) {
            var e = t.serverControl
              , s = t.targetDuration
              , i = t.partTargetDuration;
            if (e) {
                var r = "#EXT-X-SERVER-CONTROL"
                  , a = "holdBack"
                  , n = "partHoldBack"
                  , o = s && 3 * s
                  , u = i && 2 * i;
                s && !e.hasOwnProperty(a) && (e[a] = o,
                this.trigger("info", {
                    message: r + " defaulting HOLD-BACK to targetDuration * 3 (" + o + ")."
                })),
                o && e[a] < o && (this.trigger("warn", {
                    message: r + " clamping HOLD-BACK (" + e[a] + ") to targetDuration * 3 (" + o + ")"
                }),
                e[a] = o),
                i && !e.hasOwnProperty(n) && (e[n] = 3 * i,
                this.trigger("info", {
                    message: r + " defaulting PART-HOLD-BACK to partTargetDuration * 3 (" + e[n] + ")."
                })),
                i && e[n] < u && (this.trigger("warn", {
                    message: r + " clamping PART-HOLD-BACK (" + e[n] + ") to partTargetDuration * 2 (" + u + ")."
                }),
                e[n] = u)
            }
        }
          , S = function(t) {
            function e() {
                var e;
                (e = t.call(this) || this).lineStream = new h,
                e.parseStream = new b,
                e.lineStream.pipe(e.parseStream);
                var s, i, r = c.default(e), a = [], n = {}, o = !1, u = function() {}, l = {
                    AUDIO: {},
                    VIDEO: {},
                    "CLOSED-CAPTIONS": {},
                    SUBTITLES: {}
                }, g = 0;
                e.manifest = {
                    allowCache: !0,
                    discontinuityStarts: [],
                    segments: []
                };
                var p = 0
                  , m = 0;
                return e.on("end", (function() {
                    n.uri || !n.parts && !n.preloadHints || (!n.map && s && (n.map = s),
                    !n.key && i && (n.key = i),
                    n.timeline || "number" != typeof g || (n.timeline = g),
                    e.manifest.preloadSegment = n)
                }
                )),
                e.parseStream.on("data", (function(t) {
                    var e, c;
                    ({
                        tag: function() {
                            ({
                                version: function() {
                                    t.version && (this.manifest.version = t.version)
                                },
                                "allow-cache": function() {
                                    this.manifest.allowCache = t.allowed,
                                    "allowed"in t || (this.trigger("info", {
                                        message: "defaulting allowCache to YES"
                                    }),
                                    this.manifest.allowCache = !0)
                                },
                                byterange: function() {
                                    var e = {};
                                    "length"in t && (n.byterange = e,
                                    e.length = t.length,
                                    "offset"in t || (t.offset = p)),
                                    "offset"in t && (n.byterange = e,
                                    e.offset = t.offset),
                                    p = e.offset + e.length
                                },
                                endlist: function() {
                                    this.manifest.endList = !0
                                },
                                inf: function() {
                                    "mediaSequence"in this.manifest || (this.manifest.mediaSequence = 0,
                                    this.trigger("info", {
                                        message: "defaulting media sequence to zero"
                                    })),
                                    "discontinuitySequence"in this.manifest || (this.manifest.discontinuitySequence = 0,
                                    this.trigger("info", {
                                        message: "defaulting discontinuity sequence to zero"
                                    })),
                                    t.duration > 0 && (n.duration = t.duration),
                                    0 === t.duration && (n.duration = .01,
                                    this.trigger("info", {
                                        message: "updating zero segment duration to a small value"
                                    })),
                                    this.manifest.segments = a
                                },
                                key: function() {
                                    if (t.attributes)
                                        if ("NONE" !== t.attributes.METHOD)
                                            if (t.attributes.URI) {
                                                if ("com.apple.streamingkeydelivery" === t.attributes.KEYFORMAT)
                                                    return this.manifest.contentProtection = this.manifest.contentProtection || {},
                                                    void (this.manifest.contentProtection["com.apple.fps.1_0"] = {
                                                        attributes: t.attributes
                                                    });
                                                if ("urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed" === t.attributes.KEYFORMAT) {
                                                    return -1 === ["SAMPLE-AES", "SAMPLE-AES-CTR", "SAMPLE-AES-CENC"].indexOf(t.attributes.METHOD) ? void this.trigger("warn", {
                                                        message: "invalid key method provided for Widevine"
                                                    }) : ("SAMPLE-AES-CENC" === t.attributes.METHOD && this.trigger("warn", {
                                                        message: "SAMPLE-AES-CENC is deprecated, please use SAMPLE-AES-CTR instead"
                                                    }),
                                                    "data:text/plain;base64," !== t.attributes.URI.substring(0, 23) ? void this.trigger("warn", {
                                                        message: "invalid key URI provided for Widevine"
                                                    }) : t.attributes.KEYID && "0x" === t.attributes.KEYID.substring(0, 2) ? (this.manifest.contentProtection = this.manifest.contentProtection || {},
                                                    void (this.manifest.contentProtection["com.widevine.alpha"] = {
                                                        attributes: {
                                                            schemeIdUri: t.attributes.KEYFORMAT,
                                                            keyId: t.attributes.KEYID.substring(2)
                                                        },
                                                        pssh: f.default(t.attributes.URI.split(",")[1])
                                                    })) : void this.trigger("warn", {
                                                        message: "invalid key ID provided for Widevine"
                                                    }))
                                                }
                                                t.attributes.METHOD || this.trigger("warn", {
                                                    message: "defaulting key method to AES-128"
                                                }),
                                                i = {
                                                    method: t.attributes.METHOD || "AES-128",
                                                    uri: t.attributes.URI
                                                },
                                                void 0 !== t.attributes.IV && (i.iv = t.attributes.IV)
                                            } else
                                                this.trigger("warn", {
                                                    message: "ignoring key declaration without URI"
                                                });
                                        else
                                            i = null;
                                    else
                                        this.trigger("warn", {
                                            message: "ignoring key declaration without attribute list"
                                        })
                                },
                                "media-sequence": function() {
                                    isFinite(t.number) ? this.manifest.mediaSequence = t.number : this.trigger("warn", {
                                        message: "ignoring invalid media sequence: " + t.number
                                    })
                                },
                                "discontinuity-sequence": function() {
                                    isFinite(t.number) ? (this.manifest.discontinuitySequence = t.number,
                                    g = t.number) : this.trigger("warn", {
                                        message: "ignoring invalid discontinuity sequence: " + t.number
                                    })
                                },
                                "playlist-type": function() {
                                    /VOD|EVENT/.test(t.playlistType) ? this.manifest.playlistType = t.playlistType : this.trigger("warn", {
                                        message: "ignoring unknown playlist type: " + t.playlist
                                    })
                                },
                                map: function() {
                                    s = {},
                                    t.uri && (s.uri = t.uri),
                                    t.byterange && (s.byterange = t.byterange),
                                    i && (s.key = i)
                                },
                                "stream-inf": function() {
                                    this.manifest.playlists = a,
                                    this.manifest.mediaGroups = this.manifest.mediaGroups || l,
                                    t.attributes ? (n.attributes || (n.attributes = {}),
                                    d.default(n.attributes, t.attributes)) : this.trigger("warn", {
                                        message: "ignoring empty stream-inf attributes"
                                    })
                                },
                                media: function() {
                                    if (this.manifest.mediaGroups = this.manifest.mediaGroups || l,
                                    t.attributes && t.attributes.TYPE && t.attributes["GROUP-ID"] && t.attributes.NAME) {
                                        var s = this.manifest.mediaGroups[t.attributes.TYPE];
                                        s[t.attributes["GROUP-ID"]] = s[t.attributes["GROUP-ID"]] || {},
                                        e = s[t.attributes["GROUP-ID"]],
                                        (c = {
                                            default: /yes/i.test(t.attributes.DEFAULT)
                                        }).default ? c.autoselect = !0 : c.autoselect = /yes/i.test(t.attributes.AUTOSELECT),
                                        t.attributes.LANGUAGE && (c.language = t.attributes.LANGUAGE),
                                        t.attributes.URI && (c.uri = t.attributes.URI),
                                        t.attributes["INSTREAM-ID"] && (c.instreamId = t.attributes["INSTREAM-ID"]),
                                        t.attributes.CHARACTERISTICS && (c.characteristics = t.attributes.CHARACTERISTICS),
                                        t.attributes.FORCED && (c.forced = /yes/i.test(t.attributes.FORCED)),
                                        e[t.attributes.NAME] = c
                                    } else
                                        this.trigger("warn", {
                                            message: "ignoring incomplete or missing media group"
                                        })
                                },
                                discontinuity: function() {
                                    g += 1,
                                    n.discontinuity = !0,
                                    this.manifest.discontinuityStarts.push(a.length)
                                },
                                "program-date-time": function() {
                                    void 0 === this.manifest.dateTimeString && (this.manifest.dateTimeString = t.dateTimeString,
                                    this.manifest.dateTimeObject = t.dateTimeObject),
                                    n.dateTimeString = t.dateTimeString,
                                    n.dateTimeObject = t.dateTimeObject
                                },
                                targetduration: function() {
                                    !isFinite(t.duration) || t.duration < 0 ? this.trigger("warn", {
                                        message: "ignoring invalid target duration: " + t.duration
                                    }) : (this.manifest.targetDuration = t.duration,
                                    T.call(this, this.manifest))
                                },
                                start: function() {
                                    t.attributes && !isNaN(t.attributes["TIME-OFFSET"]) ? this.manifest.start = {
                                        timeOffset: t.attributes["TIME-OFFSET"],
                                        precise: t.attributes.PRECISE
                                    } : this.trigger("warn", {
                                        message: "ignoring start declaration without appropriate attribute list"
                                    })
                                },
                                "cue-out": function() {
                                    n.cueOut = t.data
                                },
                                "cue-out-cont": function() {
                                    n.cueOutCont = t.data
                                },
                                "cue-in": function() {
                                    n.cueIn = t.data
                                },
                                skip: function() {
                                    this.manifest.skip = E(t.attributes),
                                    this.warnOnMissingAttributes_("#EXT-X-SKIP", t.attributes, ["SKIPPED-SEGMENTS"])
                                },
                                part: function() {
                                    var e = this;
                                    o = !0;
                                    var s = this.manifest.segments.length
                                      , i = E(t.attributes);
                                    n.parts = n.parts || [],
                                    n.parts.push(i),
                                    i.byterange && (i.byterange.hasOwnProperty("offset") || (i.byterange.offset = m),
                                    m = i.byterange.offset + i.byterange.length);
                                    var r = n.parts.length - 1;
                                    this.warnOnMissingAttributes_("#EXT-X-PART #" + r + " for segment #" + s, t.attributes, ["URI", "DURATION"]),
                                    this.manifest.renditionReports && this.manifest.renditionReports.forEach((function(t, s) {
                                        t.hasOwnProperty("lastPart") || e.trigger("warn", {
                                            message: "#EXT-X-RENDITION-REPORT #" + s + " lacks required attribute(s): LAST-PART"
                                        })
                                    }
                                    ))
                                },
                                "server-control": function() {
                                    var e = this.manifest.serverControl = E(t.attributes);
                                    e.hasOwnProperty("canBlockReload") || (e.canBlockReload = !1,
                                    this.trigger("info", {
                                        message: "#EXT-X-SERVER-CONTROL defaulting CAN-BLOCK-RELOAD to false"
                                    })),
                                    T.call(this, this.manifest),
                                    e.canSkipDateranges && !e.hasOwnProperty("canSkipUntil") && this.trigger("warn", {
                                        message: "#EXT-X-SERVER-CONTROL lacks required attribute CAN-SKIP-UNTIL which is required when CAN-SKIP-DATERANGES is set"
                                    })
                                },
                                "preload-hint": function() {
                                    var e = this.manifest.segments.length
                                      , s = E(t.attributes)
                                      , i = s.type && "PART" === s.type;
                                    n.preloadHints = n.preloadHints || [],
                                    n.preloadHints.push(s),
                                    s.byterange && (s.byterange.hasOwnProperty("offset") || (s.byterange.offset = i ? m : 0,
                                    i && (m = s.byterange.offset + s.byterange.length)));
                                    var r = n.preloadHints.length - 1;
                                    if (this.warnOnMissingAttributes_("#EXT-X-PRELOAD-HINT #" + r + " for segment #" + e, t.attributes, ["TYPE", "URI"]),
                                    s.type)
                                        for (var a = 0; a < n.preloadHints.length - 1; a++) {
                                            var o = n.preloadHints[a];
                                            o.type && (o.type === s.type && this.trigger("warn", {
                                                message: "#EXT-X-PRELOAD-HINT #" + r + " for segment #" + e + " has the same TYPE " + s.type + " as preload hint #" + a
                                            }))
                                        }
                                },
                                "rendition-report": function() {
                                    var e = E(t.attributes);
                                    this.manifest.renditionReports = this.manifest.renditionReports || [],
                                    this.manifest.renditionReports.push(e);
                                    var s = this.manifest.renditionReports.length - 1
                                      , i = ["LAST-MSN", "URI"];
                                    o && i.push("LAST-PART"),
                                    this.warnOnMissingAttributes_("#EXT-X-RENDITION-REPORT #" + s, t.attributes, i)
                                },
                                "part-inf": function() {
                                    this.manifest.partInf = E(t.attributes),
                                    this.warnOnMissingAttributes_("#EXT-X-PART-INF", t.attributes, ["PART-TARGET"]),
                                    this.manifest.partInf.partTarget && (this.manifest.partTargetDuration = this.manifest.partInf.partTarget),
                                    T.call(this, this.manifest)
                                }
                            }[t.tagType] || u).call(r)
                        },
                        uri: function() {
                            n.uri = t.uri,
                            a.push(n),
                            this.manifest.targetDuration && !("duration"in n) && (this.trigger("warn", {
                                message: "defaulting segment duration to the target duration"
                            }),
                            n.duration = this.manifest.targetDuration),
                            i && (n.key = i),
                            n.timeline = g,
                            s && (n.map = s),
                            m = 0,
                            n = {}
                        },
                        comment: function() {},
                        custom: function() {
                            t.segment ? (n.custom = n.custom || {},
                            n.custom[t.customType] = t.data) : (this.manifest.custom = this.manifest.custom || {},
                            this.manifest.custom[t.customType] = t.data)
                        }
                    })[t.type].call(r)
                }
                )),
                e
            }
            l.default(e, t);
            var s = e.prototype;
            return s.warnOnMissingAttributes_ = function(t, e, s) {
                var i = [];
                s.forEach((function(t) {
                    e.hasOwnProperty(t) || i.push(t)
                }
                )),
                i.length && this.trigger("warn", {
                    message: t + " lacks required attribute(s): " + i.join(", ")
                })
            }
            ,
            s.push = function(t) {
                this.lineStream.push(t)
            }
            ,
            s.end = function() {
                this.lineStream.push("\n"),
                this.trigger("end")
            }
            ,
            s.addParser = function(t) {
                this.parseStream.addParser(t)
            }
            ,
            s.addTagMapper = function(t) {
                this.parseStream.addTagMapper(t)
            }
            ,
            e
        }(g.default);
        s.LineStream = h,
        s.ParseStream = b,
        s.Parser = S
    }
    , {
        "@babel/runtime/helpers/assertThisInitialized": 5,
        "@babel/runtime/helpers/extends": 6,
        "@babel/runtime/helpers/inheritsLoose": 7,
        "@videojs/vhs-utils/cjs/decode-b64-to-uint8-array.js": 10,
        "@videojs/vhs-utils/cjs/stream.js": 11
    }],
    "p2p-media-loader-hlsjs": [function(t, e, s) {
        "use strict";
        var i = this && this.__createBinding || (Object.create ? function(t, e, s, i) {
            void 0 === i && (i = s),
            Object.defineProperty(t, i, {
                enumerable: !0,
                get: function() {
                    return e[s]
                }
            })
        }
        : function(t, e, s, i) {
            void 0 === i && (i = s),
            t[i] = e[s]
        }
        )
          , r = this && this.__exportStar || function(t, e) {
            for (var s in t)
                "default" === s || Object.prototype.hasOwnProperty.call(e, s) || i(e, t, s)
        }
        ;
        Object.defineProperty(s, "__esModule", {
            value: !0
        }),
        s.initHlsJsPlayer = s.version = void 0,
        s.version = "0.6.2",
        r(t("./engine"), s),
        r(t("./segment-manager"), s),
        s.initHlsJsPlayer = function(t) {
            t && t.config && t.config.loader && "function" == typeof t.config.loader.getEngine && function(t, e) {
                t.on("hlsFragChanged", ((t,s)=>{
                    const i = s.frag
                      , r = 2 !== i.byteRange.length ? void 0 : {
                        offset: i.byteRange[0],
                        length: i.byteRange[1] - i.byteRange[0]
                    };
                    e.setPlayingSegment(i.url, r, i.start, i.duration)
                }
                )),
                t.on("hlsDestroying", (async()=>{
                    await e.destroy()
                }
                )),
                t.on("hlsError", ((s,i)=>{
                    if ("bufferStalledError" === i.details) {
                        const s = void 0 === t.media ? t.el_ : t.media;
                        s && e.setPlayingSegmentByCurrentTime(s.currentTime)
                    }
                }
                ))
            }(t, t.config.loader.getEngine())
        }
    }
    , {
        "./engine": 2,
        "./segment-manager": 4
    }]
}, {}, [1]);
