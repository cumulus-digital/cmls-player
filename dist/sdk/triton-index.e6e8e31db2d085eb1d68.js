"use strict";(self.webpackChunkCmlsPlayer=self.webpackChunkCmlsPlayer||[]).push([[804],{2376:function(t,e,a){a.r(e),a.d(e,{default:function(){return L}});var i=a(5826),n=a(1055),s=a(6046),r=a(743),o=a(9455),l=a(9011),d=JSON.parse('{"url":"\'//sdk.listenlive.co/web/2.9/td-sdk.min.js\'","td_player_config":{"coreModules":[{"id":"MediaPlayer","playerId":"cmlsmediaplayer-player","geoTargeting":{"desktop":{"isActive":false}},"plugins":[{"id":"vastAd"}]},{"id":"NowPlayingApi"}]},"status_map":{"_comment":"Map INTERFACE_STATUS: COMMON_STATUS. See src/consts.js","LIVE_STOP":"LIVE_STOP","LIVE_PAUSE":"LIVE_PAUSE","LIVE_PLAYING":"LIVE_PLAYING","LIVE_FAILED":"LIVE_FAILED","LIVE_PREROLL":"LIVE_PREROLL","LIVE_BUFFERING":"LIVE_BUFFERING","LIVE_CONNECTING":"LIVE_CONNECTING","LIVE_RECONNECTING":"LIVE_RECONNECTING","GETTING_STATION_INFORMATION":"GETTING_STATION_INFORMATION","STREAM_GEO_BLOCKED":"STREAM_GEO_BLOCKED","STREAM_GEO_BLOCKED_ALTERNATE":"STREAM_GEO_BLOCKED_ALTERNATE","STREAM_GEO_BLOCKED_NO_ALTERNATE":"STREAM_GEO_BLOCKED_NO_ALTERNATE","STATION_NOT_FOUND":"STATION_NOT_FOUND","PLAY_NOT_ALLOWED":"PLAY_NOT_ALLOWED"}}'),c=a(9039),u=a(3583),p=a(1718),h=a(54);const m=new u.Z("Triton SDK / CuePointHandler");class y{parent;adBreakTimeouts={};constructor(t){if(this.parent=t,!this.parent?.getPlayer())throw new Error("CuePointHandler instantiated without player.")}onReady(t){const e={"track-cue-point":this.onTrackCuePoint.bind(this),"speech-cue-point":this.onSpeechCuePoint.bind(this),"custom-cue-point":this.onCustomCuePoint.bind(this),"ad-break-cue-point":this.onAdBreakCuePointStart.bind(this),"ad-break-cue-point-complete":this.onAdBreakCuePointComplete.bind(this)};for(let a in e)m.debug("Attaching listener",{event:a,callback_name:e[a].name},e[a]),t.addEventListener(a,e[a])}generateCuePoint(t){return{artist:t?.artistName,title:t?.cueTitle,type:t?.type,track_id:t?.trackId}}getMountFromCueData(t){if(!t)return-1;const e=t?.mount;return e||-2}sendCuePointEvent(t,e,a){h.B.emitEvent("cue-point",{mount:t,cuepoint:e,event:a})}onTrackCuePoint(t){const e=t?.data?.cuePoint,a={event:t},i=this.getMountFromCueData(e);if(-1===i)return void m.warn("Received a live track cue point without cuePoint data!",a);-2===i&&m.warn("Received a live track cue point without a mount!",a),m.debug("Live track cue point received",a);const n=new p.S(this.generateCuePoint(e));this.sendCuePointEvent(i,n,t),h.B.setCuePoint({mount:i,cue:n}),this.clearAdBreakTimeout(i)}onSpeechCuePoint(t){const e=t?.data?.cuePoint,a={event:t},i=this.getMountFromCueData(e);if(-1===i)return void m.warn("Received a live speech cue point without cuePoint data!",a);if(-2===i)return void m.warn("Received a live speech cue point without a mount!",a);m.debug("Live speech cue point received",a);const n=new p.S({...this.generateCuePoint(e),type:p.S.types.SPEECH});this.sendCuePointEvent(i,n,t),h.B.setCuePoint({mount:i,cue:n}),this.clearAdBreakTimeout(i)}onCustomCuePoint(t){const e=t?.data?.cuePoint,a={event:t},i=this.getMountFromCueData(e);-1!==i?-2!==i?(m.debug("Custom cue point received. Cue display will be reset.",a),h.B.setCuePoint({mount:i,cue:!1}),this.clearAdBreakTimeout(i)):m.warn("Received a custom cue point without a mount!",a):m.warn("Received a custom cue point without cuePoint data!",a)}parseCueDuration(t){if(Number.isInteger(t))return t}onAdBreakCuePointStart(t){const{playerState:e}=n.Z.getState(),a=e.stations[e.playing];if(!a)return void m.warn("Received an ad break cue point without a playing station!",{event:t,playerState:e});if("endbreak"===t?.data?.cuePoint?.adType)return m.debug('Ad break start received with adType "endbreak", ignoring and resetting cue point.',{mount:a.mount,event:t}),void h.B.setCuePoint({mount:a.mount});m.debug("Ad break start",{mount:a.mount,event:t,isVastInStream:t?.data?.adBreakData?.isVastInStream}),!1===t?.data?.adBreakData?.isVastInStream?m.info("Found an ad break with isVastInStream: false!",{mount:a.mount,event:t}):m.debug("Ad break isVastInStream",t.data.adBreakData.isVastInStream);const i={artist:a?.name||"Ad Break",title:"We'll return after these messages",track_id:t?.data?.cuePoint?.adId||Date.now(),type:p.S.types.AD};if(h.B.setCuePoint({mount:a.mount,cue:i}),this.clearAdBreakTimeout(a.mount),t?.data?.cuePoint?.cuePointDuration){const e=this.parseCueDuration(t.data.cuePoint.cuePointDuration);e?(m.debug("Using ad break cue duration for inferred complete",{mount:a.mount,event:t,duration:e}),this.adBreakTimeouts[a.mount]=setTimeout((()=>{m.debug("Inferring ad break complete.",{mount:a.mount,previous_event:t}),h.B.setCuePoint({mount:a.mount,cue:!1})}),e)):m.debug("Failed to parse ad break duration",{mount:a.mount,event:t,duration:e})}}onAdBreakCuePointComplete(t){const{playerState:e}=n.Z.getState(),a=e.stations[e.playing];a?(this.clearAdBreakTimeout(a.mount),e.cuepoints?.[a.mount]?.type===p.S.types.AD?(m.debug("Ad break complete",{mount:a.mount,event:t,playerState:e}),h.B.setCuePoint({mount:a.mount})):m.warn("Received ad break cue point complete that did not follow an ad!",{mount:a.mount,event:t,current_cue:e.cuepoints[a.mount]})):m.warn("Received an ad break end cue point without a playing station!",{event:t,playerState:e})}clearAdBreakTimeout(t){this.adBreakTimeouts[t]&&(clearTimeout(this.adBreakTimeouts[t]),this.adBreakTimeouts[t]=null)}}a(8858),a(1318),a(3228);var g=a(8796);const b=(0,l.Z)(o),P=new u.Z("Triton SDK / MediaPlayer");class w{parent;el;defaultCallback;playbackCompleteCallback;hasPlayed=!1;constructor(t,e=null){this.parent=t,e&&(this.defaultCallback=e),a.e(567).then(a.bind(a,4792)),this.el=(0,i.h)("div",{class:`cmls-player-mediaplayer ${g.D.safeClass}`},(0,i.h)("div",{class:"outer-container"},(0,i.h)("div",{class:"inner-container"},(0,i.h)("div",{id:`${b.mediaplayer_id_prefix}-${this.parent.mediaPlayerId}`,class:"player"})))),document.body.appendChild(this.el)}onReady(t){const e={"ad-playback-complete":this.onPlaybackComplete.bind(this),"ad-playback-error":this.onPlaybackError.bind(this),"ad-playback-start":this.onPlaybackStart.bind(this)};for(let a in e)t.addEventListener(a,e[a])}isTimeForAnotherPreroll(){const{playerState:t}=n.Z.getState();if(t?.last_preroll){const e=Date.now()-t?.last_preroll,a=Math.floor(Math.abs(e)/1e3),i=Math.floor(a/60);if(P.debug("Time since last preroll:",{minutes:i,seconds:a}),e<6e4*t.minutes_between_preroll)return!1}return!0}onPlaybackStart(t){P.debug("Playback start"),n.Z.dispatch(s.Xi["set/interactive"](!1)),this.hasPlayed=!0,this.el.classList.add("show"),h.B.emitEvent("preroll-start")}onPlaybackError(t){P.warn("Playback error!",t),this.onPlaybackComplete(t)}onPlaybackComplete(t){return(0,r.dC)((()=>{this.hasPlayed&&(P.debug("Playback complete"),n.Z.dispatch(s.Xi["set/last_preroll"](Date.now()))),n.Z.dispatch(s.Xi["set/interactive"](!0))})),this.hasPlayed=!1,this.el.classList.remove("show"),h.B.emitEvent("preroll-end"),this.playbackCompleteCallback?this.playbackCompleteCallback():this.defaultCallback?this.defaultCallback():void 0}playVastAd(t,e=null){e&&(this.playbackCompleteCallback=e);const{playerState:a}=n.Z.getState();if(a.ad_blocker_detected)return P.debug("Ad blocker detected, skipping preroll"),this.onPlaybackComplete();if(!this.isTimeForAnotherPreroll())return P.debug("Last preroll was less than minutes_between_preroll",a.minutes_between_preroll),this.onPlaybackComplete();const i=new URL(t||a.station_data?.[a.playing]?.vast);if(!i)return P.debug("Invalid vast URL",{called_with:t,station_state_has:a.station_data?.[a.playing]?.vast}),this.onPlaybackComplete();i.searchParams.set("correlator",Date.now()),i.searchParams.set("description_url",window.self.location),i.searchParams.set("url",window.self.location);const r={stationName:a.playing.replace("AAC",""),url:i.toString(),trackingParameters:{player:"cmls-webplayer"}};e&&(this.playbackCompleteCallback=e),P.debug("Playing ad",r),n.Z.dispatch(s.Xi["set/status"](c.U.LIVE_PREROLL)),this.parent.playVastAd(r)}}var v=a(3268),k=a(4354),_=a(3037),f=a(9900);const S=(0,l.Z)(o),E=new u.Z("Triton SDK / NowPlayingHandler");class C{parent;nowPlayingInterval;constructor(t){this.parent=t}onReady(t=null){if(!t)throw E.error("You must supply a player object parameter."),new Error("You must supply a player object parameter.");if(!t?.NowPlayingApi)throw E.error("Player must have NowPlayingApi module."),new Error("Player must have NowPlayingApi module.");if((0,k.Z)()){const e={"list-loaded":this.onListLoaded.bind(this),"stream-stop":this.forceNowPlayingTick.bind(this),"stream-error":this.forceNowPlayingTick.bind(this),"stream-fail":this.forceNowPlayingTick.bind(this)};for(let a in e)E.debug("Attaching listener",{event:a,callback_name:e[a].name},e[a]),t.addEventListener(a,e[a]);const a=S.offline_nowplaying_interval||3e4;let i;this.nowPlayingInterval=setInterval(this.nowPlayingTick.bind(this),a),document.addEventListener("visibilitychange",(()=>{if(document.hidden)E.debug("Tab hidden"),i=Date.now();else{E.debug("Tab focus returned");const t=Date.now();t>i+a&&t<i+2*a&&(E.debug("Tab focused after tick would have fired, forcing fire"),this.forceNowPlayingTick.call(this))}})),E.debug("Offline Now Playing interval has begun.",{interval:a}),this.nowPlayingTick.call(this)}}async nowPlayingTick(t=!1){function e(t=!1){const{playerState:e}=n.Z.getState();if(e.fetch_nowplaying||!0===t)if(Object.keys(e.stations).length)for(let t in e.stations){const a=e.stations[t];if(t===e.playing)continue;if(!a.fetch_nowplaying)continue;const i=a.last_unresolved_cuepoint,n=a.unresolved_nowplaying_requests,s=S.max_unresolved_nowplaying_requests||5;if(n>s){if(n<1.5*s&&Date.now()-i>6e5){E.debug("Attempting a failsave request after 10 minutes of being disabled."),this.enableFetch(t),this.incrementUnresolvedRequests(t);continue}if(a.fetch_nowplaying){E.warn(`Mount has more than ${s} unresolved requests, disabling fetch.`,a),this.disableFetch(t);continue}}E.debug("Requesting last played",{mount:t,station:a}),this.parent.getPlayer().NowPlayingApi.load({mount:t,numberToFetch:1}),this.incrementUnresolvedRequests(t)}else E.warn("nowPlayingTick: No stations registered.",{state:e});else E.debug("Now playing fetch globally disabled during this tick.")}(0,k.Z)()?document.hidden?E.debug("Tab is hidden, skipping tick"):t?e.call(this,t):(0,_.jY)().then((a=>{a?e.call(this,t):E.debug("Not leader window, skipping now playing tick")})):E.debug("Not parent window")}forceNowPlayingTick(){this.nowPlayingTick(!0)}onListLoaded(t){const e=t?.data?.mount;if(!e)return void E.warn("No mount in offline Now Playing data!",{event:t});const{playerState:a}=n.Z.getState(),i=a.stations?.[e];if(!i)return void E.warn("Received offline Now Playing data for an unregistered station",{event:t});if(this.decrementUnresolvedRequests(e),e===a.playing)return;const s=!!t.data?.list?.length&&t?.data?.list[0];if(!s)return void E.debug("Offline Now Playing list was empty",{event:t,station:i});if(s.trackID||(s.trackID=(0,v.Z)([s?.artistName,s?.cueTitle].filter((t=>t.trim?t.trim():"")))),s.trackID===a.cuepoints?.[e]?.track_id)return;const r={artist:s?.artistName,title:s.cueTitle,track_id:s?.trackID,type:"offline-track"};E.debug("Received new offline Now Playing data",{event:t,newCue:r,station:i}),h.B.setCuePoint({mount:e,cue:r}),this.resetUnresolvedRequests(e)}setFetchFlag(t,e=!0){n.Z.dispatch(s.Xi["set/station/fetch_nowplaying"]({[t]:e}))}enableFetch(t){this.setFetchFlag(t,!0)}disableFetch(t){this.setFetchFlag(t,!1)}incrementUnresolvedRequests(t){n.Z.dispatch(s.Xi["action/station/unresolved_nowplaying_requests/increment"]([t]))}decrementUnresolvedRequests(t){n.Z.dispatch(s.Xi["action/station/unresolved_nowplaying_requests/decrement"]([t]))}resetUnresolvedRequests(t){n.Z.dispatch(s.Xi["set/station/unresolved_nowplaying_requests"]({[t]:0}))}}var T=a(300);const A=(0,l.Z)(o),N=(0,l.Z)(d),I=new u.Z("Triton SDK");class L{static player;static mediaPlayer;static mediaPlayerId;static delayPlay;static modules={};static init(t=null){I.debug("Init!"),t||(t=N.url);const e=(0,i.h)("script",{id:A.sdk_id,class:g.D.safeClass,async:!0,src:t,onLoad:this.onScriptLoad.bind(this)});document.head.appendChild(e)}static onScriptLoad(t){if(!window.TDSdk)throw new Error("initSDK called without window.TDSdk available! Triton SDK must be included.");const e={...N.td_player_config,playerReady:this.onPlayerReady.bind(this),configurationError:this.onConfigError,moduleError:this.onModuleError,adBlockerDetected:this.adBlockerDetected};this.mediaPlayerId=(0,T.Z)(),e.coreModules.find((t=>"MediaPlayer"==t.id)).playerId=`${A.mediaplayer_id_prefix}-${this.mediaPlayerId}`,window.cmls_player_tdsdk=new window.TDSdk(e);const a=this.setPlayer(window.cmls_player_tdsdk);this.player=a,this.modules.MediaPlayer=new w(this),this.modules.CuePointHandler=new y(this),this.modules.NowPlayingHandler=new C(this);for(const t in this.modules)this.modules[t]?.configure&&this.modules[t]?.configure();I.debug("Triton SDK Initialized, awaiting ready state",e,a)}static onPlayerReady(t){if(!this.player)throw I.error("onPlayerReady called, but player is not available."),new Error("onPlayerReady called, but player is not available.");const e={"stream-status":this.onStreamStatusChange.bind(this),"stream-start":this.onStreamStart.bind(this),"stream-stop":this.onStreamStop.bind(this),"stream-fail":this.onStreamError.bind(this),"stream-error":this.onStreamError.bind(this)};for(let t in e)I.debug("Attaching global player listener",{event:t,callback_name:e[t].name},e[t]),this.player.addEventListener(t,e[t]);for(const t in this.modules)this.modules[t]?.onReady&&(I.debug(`Calling ${t} onReady handler`),this.modules[t]?.onReady(this.player));h.B.setReady(!0),I.debug("SDK is ready.")}static onConfigError(t){throw t}static onModuleError(t){throw t}static adBlockerDetected(t){I.warn("Ad blocker detected",t),f.V.sdk.ad_blocker_detected.value=!0}static onStreamStatusChange(t){if(void 0===t?.data?.code)return;const e=N.status_map[t.data.code];if(void 0===c.U?.[e])return void I.debug("Unknown status received",t);const{playerState:a}=n.Z.getState();I.debug("Status change:",{mount:a.playing,status:c.U[e],event:t}),n.Z.dispatch(s.Xi["set/status"](c.U[e])),h.B.emitEvent("stream-status",{code:e,status:c.U[e],event:t}),a.playing&&c.U[e]===c.U.LIVE_PAUSE&&(console.log("LIVE_PAUSE status interpreted as STOP"),this.stop())}static onStreamStart(t){const e=s.py["station/current"](n.Z.getState());h.B.emitEvent("stream-start",{mount:e?.mount}),h.B?.onStreamStart()}static onStreamStop(t){const e=s.py["station/current"](n.Z.getState());h.B.emitEvent("stream-stop",{mount:e?.mount}),h.B?.onStreamStop()}static onStreamError(t){s.py["station/current"](n.Z.getState());h.B.emitEvent("stream-error",{mount:stations?.mount,error:t}),h.B?.onStreamError()}static setPlayer(t){return this.player=t,window._CMLS=window._CMLS||{},window._CMLS.triton_player=t,this.player}static getPlayer(){return this.player}static play(t){if(this.delayPlay)return void I.debug("Playing delayed, waiting for next tick...");let{playerState:e}=n.Z.getState();if(t||(t=e.primary_station),e.playing)return I.debug("Currently playing, stopping and delaying play"),h.B.stop(),(0,r.dC)((()=>{n.Z.dispatch(s.Xi["set/interactive"](!1)),n.Z.dispatch(s.Xi["set/status"](c.U.LIVE_CONNECTING))})),void(this.delayPlay=setInterval((()=>{const{playerState:e}=n.Z.getState();e.playing||(clearInterval(this.delayPlay),this.delayPlay=null,h.B.onPlayMessage(t))}),300));if(I.debug("Play station!",{mount:t}),(0,r.dC)((()=>{h.B.setCuePoint({mount:t,cue:!1}),n.Z.dispatch(s.Xi["set/playing"](t)),n.Z.dispatch(s.Xi["set/station/active"](t)),n.Z.dispatch(s.Xi["set/interactive"](!1))})),this.playingHere=!0,this.modules?.MediaPlayer)try{e=n.Z.getState()?.playerState,this.modules.MediaPlayer.playVastAd(e.stations[t].vast,(e=>{this.beginStream(t)}))}catch(e){I.error("Error playing vast ad!",e),this.beginStream(t)}else this.beginStream(t)}static beginStream(t){this.player.play({mount:t,trackingParameters:{dist:"cmls-webplayer"}}),n.Z.dispatch(s.Xi["set/interactive"](!0))}static stop(){I.debug("Stopping!"),this.player.stop()}static playVastAd(t){const e={trackingParameters:{},...t};e.trackingParameters?.player||(e.trackingParameters.player="cmls-webplayer"),n.Z.dispatch(s.Xi["set/status"](c.U.LIVE_PREROLL));try{this.player.playAd("vastAd",e)}catch(t){I.error("Error playing vast ad!",t),this.modules?.MediaPlayer?.onPlaybackError(t)}}static forceUpdateCuepoints(){this.modules?.NowPlayingHandler?.forceNowPlayingTick()}}}}]);