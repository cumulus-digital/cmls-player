"use strict";(self.webpackChunkcmls_player=self.webpackChunkcmls_player||[]).push([[700],{5230:function(e,t,o){var n=o(8081),i=o.n(n),r=o(3645),a=o.n(r)()(i());a.push([e.id,':host{--fontSize: 13.5px;--highlightColor: #000;--backgroundColor: #e00;--textColor: #fff;font-family:"Open sans",arial,sans-serif;font-size:13.5px;font-size:var(--fontSize);text-align:left;text-decoration-thickness:1px;text-decoration-thickness:from-font;text-underline-offset:.2em}:host,:host::after,:host::before,:host *,:host *::after,:host *::before{box-sizing:border-box}h1,h2,h3{margin:0;padding:0}h2{font-size:calc(var(--fontSize)*1.3)}h3{font-size:calc(var(--fontSize)*1.15)}img{height:auto;max-width:100%;max-height:100%;-o-object-fit:fill;object-fit:fill}svg{width:100%;height:100%;-o-object-fit:fill;object-fit:fill}button{display:block;background:rgba(0,0,0,0);color:inherit;border:0;text-align:left}.listen-live-container{display:none;background-color:var(--backgroundColor);background-image:linear-gradient(-20deg, rgba(0, 0, 0, 0.1) 20%, transparent 40%, rgba(0, 0, 0, 0.2) 100%);color:var(--textColor);border:1px outset rgba(255,255,255,.1);border-radius:3px;overflow:hidden;-webkit-user-select:none;-moz-user-select:none;user-select:none}@supports (color: color-mix(in lch, red, blue)){\n.listen-live-container{background-image:linear-gradient(-20deg, color-mix(in srgb, var(--highlightColor) 10%, transparent) 20%, transparent 40%, color-mix(in srgb, var(--highlightColor) 20%, transparent) 100%);border:1px outset color-mix(in srgb, var(--textColor) 10%, transparent)}\n}.listen-live-container.ready{display:inline-flex}.listen-live-button{display:flex;flex-direction:row;align-items:stretch;justify-content:space-between;width:100%;min-width:200px;max-width:200px;height:60px;max-height:100%;padding:5px;position:relative;overflow:hidden;cursor:wait;line-height:1.2}.interactive .listen-live-button{cursor:pointer}.listen-live-button::before{content:"";display:block;width:100%;height:100%;position:absolute;z-index:0;left:0;top:0;background-color:var(--highlightColor);opacity:0;transition:opacity .2s}.listen-live-button:hover::before{opacity:.1}.play-icon-container{flex:0 0 35px;width:35px;height:35px;display:flex;align-items:center;justify-content:center;align-self:center;justify-self:center;margin-right:4px;position:relative;z-index:0}.play-icon-container .play-icon{display:flex;align-items:center;justify-content:center;border-radius:50%;width:30px;height:30px;position:relative;z-index:2;filter:drop-shadow(0 0 10px rgba(0, 0, 0, 0.5333333333))}.playing .play-icon-container .play-icon::before{--waveLeft: 0%;--waveTop: 10%;--fromOpacity: 0;--toOpacity: 0.3;--toSize: 1100%;--waveSpeed: 4s}.activity .play-icon-container .play-icon::before{content:"";display:block;width:120%;height:120%;position:absolute;left:-10%;top:-10%;border-top:3px solid var(--textColor);border-right:2px solid rgba(0,0,0,0);border-left:2px dotted var(--textColor);border-radius:50%;opacity:.5;animation:1.8s linear infinite rotatePlay;will-change:transform,opacity}@keyframes rotatePlay{0%{transform:rotate(0deg)}50%{transform:rotate(180deg);opacity:.7}100%{transform:rotate(360deg)}}.playing .play-icon-container::before,.playing .play-icon-container::after{--waveDelay: 0.3s;--waveSpeed: 1.2s;--toSize: 180%}.playing .play-icon-container::before{--waveDelay: 1s;--waveSpeed: 1.5s;--toSize: 230%}.label-area{flex:1 0;overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;align-self:center;justify-self:flex-start;position:relative;z-index:2;line-height:1.15;text-shadow:1px 1px 1px rgba(0,0,0,.1)}.label-area .scroll{-webkit-mask-image:linear-gradient(to right, transparent 0%, black 3px, black calc(100% - 6px), transparent 100%);mask-image:linear-gradient(to right, transparent 0%, black 3px, black calc(100% - 6px), transparent 100%)}.label-area .playing-label{font-size:8.5px;letter-spacing:.055em;line-height:1;text-transform:uppercase;opacity:.85}.label-area .state{font-size:calc(var(--fontSize)*1.69);font-stretch:87.5%;font-weight:700}.stopped .label-area .state{line-height:1;text-transform:uppercase}.activity .label-area .state{font-size:calc(var(--fontSize)*1.55)}.playing .label-area .state{font-size:calc(var(--fontSize)*1.4)}.label-area .cue{opacity:.95}.dropdown-handle{flex:0 0 40px;width:40px;display:flex;align-items:center;justify-content:center;justify-self:flex-end;padding:8px;border-left:2px groove rgba(255,255,255,.3);position:relative;z-index:2;overflow:hidden}@supports (color: color-mix(in lch, red, blue)){\n.dropdown-handle{border-left:2px groove color-mix(in srgb, var(--textColor) 30%, transparent)}\n}.dropdown-handle svg{opacity:.85}.dropdown-handle:before{content:"";display:block;width:100%;height:100%;position:absolute;left:0;top:0;z-index:-1;background-color:var(--highlightColor);opacity:.15;transition:opacity .2s}.dropdown-handle:hover svg,.dropdown-handle:focus-visible svg{opacity:1}.dropdown-handle:hover::before,.dropdown-handle:focus-visible::before{opacity:.3}.dropdown-container{display:flex;position:absolute;top:100%;top:var(--dropdownPosition, 100%);z-index:2147483640;max-width:100vw;border-radius:0 3px 3px 3px;overflow:hidden}.dropdown-container>div{display:flex}.dropdown-container.align-center{left:50%;transform:translateX(-50%);border-radius:3px}.dropdown-container.align-right{left:0;left:var(--buttonRight, 0);transform:translateX(-100%);border-radius:3px 0 3px 3px}.dropdown-inner{background-color:var(--backgroundColor);background-image:linear-gradient(10deg, rgba(0, 0, 0, 0.2) 20%, rgba(0, 0, 0, 0.15) 40%, rgba(0, 0, 0, 0.3) 100%);box-shadow:5px 5px rgba(0,0,0,.15);width:350px;max-width:100%;max-height:0;overflow:hidden;transition:max-height .1s, visibility .1s;position:sticky;right:0}@supports (color: color-mix(in lch, red, blue)){\n.dropdown-inner{background-image:linear-gradient(10deg, color-mix(in srgb, var(--highlightColor) 20%, transparent) 20%, color-mix(in srgb, var(--highlightColor) 15%, transparent) 40%, color-mix(in srgb, var(--highlightColor) 30%, transparent) 100%)}\n}.open .dropdown-inner{max-height:100%}.dropdown-station{display:flex;flex-direction:row;gap:calc(var(--fontSize)*.75);line-height:1.25;position:relative;width:100%;padding:calc(var(--fontSize)*1.5);border-bottom:2px groove rgba(255,255,255,.4);cursor:wait}@supports (color: color-mix(in lch, red, blue)){\n.dropdown-station{border-bottom:2px groove color-mix(in srgb, var(--textColor) 40%, transparent)}\n}.dropdown-station:last-child{border-bottom:0}.interactive .dropdown-station{cursor:pointer}.dropdown-station::before{content:"";display:block;width:100%;height:100%;position:absolute;z-index:-1;left:0;top:0;background-color:var(--highlightColor);opacity:0;transition:opacity .15s}.dropdown-station:hover::before,.dropdown-station:focus-visible::before{opacity:.2}.dropdown-station:hover h2,.dropdown-station:focus-visible h2{-webkit-text-decoration:underline;text-decoration:underline}.dropdown-station .logo{display:flex;flex-basis:20%;min-height:calc(var(--fontSize)*2.5);width:20%;height:-moz-fit-content;height:fit-content;position:relative;top:calc(var(--fontSize)*.1);opacity:1;transition:opacity .2s}.dropdown-station .logo .overlay{display:block;width:calc(var(--fontSize)*2.5);height:calc(var(--fontSize)*2.5);position:absolute;left:50%;top:50%;transform:translate(-50%, -50%);opacity:0;filter:drop-shadow(0 0 1px rgba(0, 0, 0, 0.3)) drop-shadow(2px 2px 1px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 1em #000);transition:opacity .15s}.dropdown-station.playing .logo img,.dropdown-station:hover .logo img,.dropdown-station:focus-visible .logo img{opacity:.6}.dropdown-station.playing .logo .overlay,.dropdown-station:hover .logo .overlay,.dropdown-station:focus-visible .logo .overlay{opacity:1}.dropdown-station .info{flex-basis:80%}.dropdown-station .status{display:block;width:-moz-fit-content;width:fit-content;background-color:rgba(0,0,0,.6);padding:calc(var(--fontSize)*.4);font-style:normal;font-size:9px;letter-spacing:.03em;line-height:8px;text-transform:uppercase;margin-top:-0.65em;margin-bottom:3px;opacity:.9}@supports (color: color-mix(in lch, red, blue)){\n.dropdown-station .status{background-color:color-mix(in srgb, var(--highlightColor) 50%, transparent)}\n}.dropdown-station .status:before{content:"⦿ ";display:inline;color:red}.dropdown-station .nowplaying{display:flex;gap:.75em;margin-top:.5em;font-size:calc(var(--fontSize)*.9);line-height:1.4}.dropdown-station .nowplaying .artwork{max-height:calc(var(--fontSize)*3)}.scroll-label{display:flex;flex-direction:row;max-width:100%;position:relative;overflow:hidden}.scroll-label span{display:flex;flex:0 0 auto;flex-direction:row;transform:translate3d(0, 0, 0);will-change:transform}.scroll-label.scroll span{animation:10s infinite linear scrollLabel;animation:var(--speed, 10s) infinite linear scrollLabel;--distance: calc(-100% - 2ch)}.scroll-label.scroll span::after{content:attr(data-label);padding-left:2ch;position:absolute;left:100%;white-space:nowrap}@keyframes scrollLabel{from{transform:translate3d(0, 0, 0)}to{transform:translate3d(var(--distance), 0, 0)}}.extendWave,.playing .play-icon-container .play-icon::before,.playing .play-icon-container::before,.playing .play-icon-container::after{content:"";background-image:linear-gradient(90deg, transparent 0%, var(--backgroundColor) 100%);border-radius:50%;position:absolute;z-index:-1;left:45%;left:var(--waveLeft, 45%);top:50%;top:var(--waveTop, 50%);transform:translate(-50%, -50%);filter:drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));animation:1s linear 0s infinite extendWave;animation:var(--waveSpeed, 1s) linear var(--waveDela, 0s) infinite extendWave;will-change:width,height,opacity}@keyframes extendWave{0%{width:0;height:0;opacity:0;opacity:var(--fromOpacity, 0)}70%{width:calc(200%*.7);width:calc(var(--toSize, 200%)*.7);height:calc(200%*.7);height:calc(var(--toSize, 200%)*.7);opacity:0.65;opacity:var(--toOpacity, 0.65)}100%{width:200%;width:var(--toSize, 200%);height:200%;height:var(--toSize, 200%);opacity:0;opacity:var(--endOpacity, 0)}}',""]),t.Z=a},3645:function(e){e.exports=function(e){var t=[];return t.toString=function(){return this.map((function(t){var o="",n=void 0!==t[5];return t[4]&&(o+="@supports (".concat(t[4],") {")),t[2]&&(o+="@media ".concat(t[2]," {")),n&&(o+="@layer".concat(t[5].length>0?" ".concat(t[5]):""," {")),o+=e(t),n&&(o+="}"),t[2]&&(o+="}"),t[4]&&(o+="}"),o})).join("")},t.i=function(e,o,n,i,r){"string"==typeof e&&(e=[[null,e,void 0]]);var a={};if(n)for(var l=0;l<this.length;l++){var s=this[l][0];null!=s&&(a[s]=!0)}for(var c=0;c<e.length;c++){var d=[].concat(e[c]);n&&a[d[0]]||(void 0!==r&&(void 0===d[5]||(d[1]="@layer".concat(d[5].length>0?" ".concat(d[5]):""," {").concat(d[1],"}")),d[5]=r),o&&(d[2]?(d[1]="@media ".concat(d[2]," {").concat(d[1],"}"),d[2]=o):d[2]=o),i&&(d[4]?(d[1]="@supports (".concat(d[4],") {").concat(d[1],"}"),d[4]=i):d[4]="".concat(i)),t.push(d))}},t}},8081:function(e){e.exports=function(e){return e[1]}},8385:function(e,t,o){o.r(t);var n=o(3379),i=o.n(n),r=o(7795),a=o.n(r),l=o(9037),s=o.n(l),c=o(3565),d=o.n(c),p=o(9216),f=o.n(p),h=o(4589),g=o.n(h),u=o(5230),v=o(1683),b=o.n(v),x={};u.Z&&u.Z.locals&&(x.locals=u.Z.locals);var y,m=0,w={};w.styleTagTransform=g(),w.setAttributes=d(),w.insert=(e,t)=>{(t&&t.target?t.target:document.head).appendChild(e)},w.domAPI=b()()?s():a(),w.insertStyleElement=f(),x.use=function(e){return w.options=e||{},m++||(y=i()(u.Z,w)),x},x.unuse=function(){m>0&&! --m&&(y(),y=null)},t.default=x},3379:function(e){var t=[];function o(e){for(var o=-1,n=0;n<t.length;n++)if(t[n].identifier===e){o=n;break}return o}function n(e,n){for(var r={},a=[],l=0;l<e.length;l++){var s=e[l],c=n.base?s[0]+n.base:s[0],d=r[c]||0,p="".concat(c," ").concat(d);r[c]=d+1;var f=o(p),h={css:s[1],media:s[2],sourceMap:s[3],supports:s[4],layer:s[5]};if(-1!==f)t[f].references++,t[f].updater(h);else{var g=i(h,n);n.byIndex=l,t.splice(l,0,{identifier:p,updater:g,references:1})}a.push(p)}return a}function i(e,t){var o=t.domAPI(t);o.update(e);return function(t){if(t){if(t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap&&t.supports===e.supports&&t.layer===e.layer)return;o.update(e=t)}else o.remove()}}e.exports=function(e,i){var r=n(e=e||[],i=i||{});return function(e){e=e||[];for(var a=0;a<r.length;a++){var l=o(r[a]);t[l].references--}for(var s=n(e,i),c=0;c<r.length;c++){var d=o(r[c]);0===t[d].references&&(t[d].updater(),t.splice(d,1))}r=s}}},9216:function(e){e.exports=function(e){var t=document.createElement("style");return e.setAttributes(t,e.attributes),e.insert(t,e.options),t}},1683:function(e){var t;e.exports=function(){return void 0===t&&(t=Boolean("undefined"!=typeof window&&"undefined"!=typeof document&&document.all&&!window.atob)),t}},3565:function(e,t,o){e.exports=function(e){var t=o.nc;t&&e.setAttribute("nonce",t)}},9037:function(e){var t,o=(t=[],function(e,o){return t[e]=o,t.filter(Boolean).join("\n")});function n(e,t,n,i){var r;if(n)r="";else{r="",i.supports&&(r+="@supports (".concat(i.supports,") {")),i.media&&(r+="@media ".concat(i.media," {"));var a=void 0!==i.layer;a&&(r+="@layer".concat(i.layer.length>0?" ".concat(i.layer):""," {")),r+=i.css,a&&(r+="}"),i.media&&(r+="}"),i.supports&&(r+="}")}if(e.styleSheet)e.styleSheet.cssText=o(t,r);else{var l=document.createTextNode(r),s=e.childNodes;s[t]&&e.removeChild(s[t]),s.length?e.insertBefore(l,s[t]):e.appendChild(l)}}var i={singleton:null,singletonCounter:0};e.exports=function(e){if("undefined"==typeof document)return{update:function(){},remove:function(){}};var t=i.singletonCounter++,o=i.singleton||(i.singleton=e.insertStyleElement(e));return{update:function(e){n(o,t,!1,e)},remove:function(e){n(o,t,!0,e)}}}},7795:function(e){e.exports=function(e){if("undefined"==typeof document)return{update:function(){},remove:function(){}};var t=e.insertStyleElement(e);return{update:function(o){!function(e,t,o){var n="";o.supports&&(n+="@supports (".concat(o.supports,") {")),o.media&&(n+="@media ".concat(o.media," {"));var i=void 0!==o.layer;i&&(n+="@layer".concat(o.layer.length>0?" ".concat(o.layer):""," {")),n+=o.css,i&&(n+="}"),o.media&&(n+="}"),o.supports&&(n+="}");var r=o.sourceMap;r&&"undefined"!=typeof btoa&&(n+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(r))))," */")),t.styleTagTransform(n,e,t.options)}(t,e,o)},remove:function(){!function(e){if(null===e.parentNode)return!1;e.parentNode.removeChild(e)}(t)}}}},4589:function(e){e.exports=function(e,t){if(t.styleSheet)t.styleSheet.cssText=e;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(e))}}}}]);