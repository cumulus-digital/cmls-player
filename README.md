# CMLS Player

A custom element UI for controlling a streaming player SDK and maintaining the stream on navigation.

The player is comprised of three, interconnected elements:

UI: A preact-based user interface for controlling the player. Configuration is achieved in the HTML markup for the placement of the player button, described below.

SDK: An interface for a streaming player SDK. Currently only supports the Triton Digital Javascript API.

Interplay and state between the SDK and UI is synchronized across windows through a customization of [redux-state-sync](https://github.com/aohua/redux-state-sync), using pubkey's [Broadcast Channel](https://github.com/pubkey/broadcast-channel) library.

Framer: Allows the SDK interface to survive navigation around the website by containing the site within an iframe on navigation. Upon a normal initial page load, Framer listens for click events to intercept. When intercepted, an iframe (the "Child") is generated to contain the next pageload, and all existing top-level page elements lacking a "do-not-remove" class are removed. History state is reflected from the child to the parent. Framer also incorporates "patches" which modify specific site-specific elements to support better support this behavior.

# Deployment and Configuration

*Note: Only one instance of the player button can exist on a page.*

The CMLS Player button is configured in HTML, and rendered in place where its markup exists in the DOM. One or more stations must be defined. If more than one station is defined, a dropdown rendered to select the station to play. One station is designated as "primary" and displayed in the primary button. If not explicitly configured in the station tags, the first station is chosen as primary.

The CMLS player's primary button controls playback of the active station, and displays its metadata. On load, the initial active station is the primary station. If additional stations are defined and another station is played through the dropdown, that station becomes the "active" station. When clicked, the primary button begins or stops the stream for the active station only.

Example configuration:

```html
<cmls-player
	background-color="#d00"
	highlight-color="blue"
	text-color="#fff"
>
	<cmls-station
		mount="WXYZFMAAC"
		name="Y Best Station"
		tagline="Today's Best Music"
		logo="https://example.com/logo.png"
		vast="https://pubads.g.doubleclick.net/gampad/ads?..."
	></cmls-station>
	<cmls-station
		primary
		mount="KNRGFMAAC"
		name="Energy Radio"
		tagline="Power up!"
		logo="https://example2.com/logo.png"
		vast="https://pubads.g.doubleclick.net/gampad/ads?..."
	></cmls-station>
</cmls-player>
```

**All tags MUST have a corresponding closing tag. There are no self-closing or "void" elements.**

## `<cmls-player>` tag

Available `<cmls-player>` attributes are as follows. Unless specified, all attributes of this element are optional, and defaults are shown in parentheses.

* `background-color` ("#e00") CSS background color for the player button and dropdown.
* `highlight-color` ("#000") CSS color used for hover states and other accents. Be aware, the highlight color is often mixed with the background-color at varying opacities.
* `text-color` ("#FFF") CSS color of all text displayed in the player button and dropdown.
* `button-height` ("50px") Specify the base height of the button. If its container has a specified height, the button will not exceed it. Value must be a CSS unit, with its unit identifier (e.g. "55px", "3em", "100%").
* `minutes-between-preroll` ("5") Number of minutes after the last time a preroll was displayed before another preroll will be shown on play.
* `offline-label` ("Listen Live!") This text is displayed when not playing along with the active station's "name" attribute.
* `show-logo-without-artwork` ("false") When the player is streaming, if there is no artwork available for the current cue point, this toggle allows showing the defined `logo` of the active station. The artwork container has a black background.
* `with-mobile-bar-on-scroll` ("false") On mobile, the button becomes a fixed top "bar" when scrolled past.
* `mobile-bar-top` ("0px") When using `with-mobile-bar-on-scroll`, you can specify the "top" value of the fixed bar. Value must be a CSS unit.

## `<cmls-station>` tag

The `<cmls-station>` tags define the actual streaming stations the player can access. At least one cmls-station must be defined. Attributes are as follows:

* `primary` Optional. Manually define a station as primary, else the first defined station is chosen.
* `mount` *REQUIRED* The Triton Mount Name for the station. Note this usually includes "AAC" or "MP3" and is distinct from the Triton Station Name.
* `name` Optional. Display name for the station.
* `tagline` Optional. Display tagline for the station.
* `logo` Optional. Display logo for the station. Recommended to use a solid background, square image.
* `vast` Optional. Vast tag URL for the station's preroll.
* `order` Optional. When defining multiple stations, the implicit order is primary, then all others in the order they are defined. This attribute allows you to override that behavior with the exception of the primary station.

# Events

The player and Framer emit events to the global window object you can listen to.

## Player Events

* `cmls-player:stream-start` Fired when live streaming begins.
* `cmls-player:stream-stop` Fired when stream stops.
* `cmls-player:stream-status` Fired on status changes from the SDK.
* `cmls-player:stream-error` Fired when an error occurs in the streaming SDK.
* `cmls-player:cue-point` Fired on cue point changes, event detail includes the new cue point.
* `cmls-player:preroll-start` Fired when preroll begins playing.
* `cmls-player:preroll-end` Fired when preroll ends (both successfully and on error).

## Framer Events

* `cmls-framer:iframe-created` Fired when the main window iframe is first created.
* `cmls-framer:iframe-state` Fired when the iframe's state (title, url) changes.

# Global API

The player exposes some helper functions to allow calling behaviors from external scripts. Public functions are under the `window.cmls_player` global.

* `cmls_player.updateLocation(url)` Loads a given URL. If the URL is of the same origin as the existing page, it is loaded within the Child iframe.
* `cmls_player.play(mountName)` Play a station mount. The mount must already be configured in the `cmls-player` markup, or the player may revert to the active station. Be aware of restictions imposed on auto-playing audio, and do not distance the call to this function from user interaction (click).

# Google Ads

When generating the Child, Framer destroys all page ads not within a .do-not-remove element.

A bug in Google's size mapping feature prevents it from working properly within iframes, causing ads to default to their base dimension from defineSlot. Framer runs too late to do anything about this, and it is left to you to manage.