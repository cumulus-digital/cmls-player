# Framer Keeps It Playing!

When coming to the site for the first time, it loads as normal. Behind the scenes, Framer is doing work to allow the next page to load without replacing the existing window context, allowing our player to keep playing!

Framer creates an invisible iframe. Form submissions and links are loaded in that frame instead of the main window, and once that happens, the iframe replaces the original site content.

Existing long-running page scripts and elements with a special "do-not-remove" class remain.