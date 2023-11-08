# Framer Keeps It Playing!

When coming to the site for the first time, the window loads as normal. Behind the scenes, Framer is doing work to allow the next page to load without replacing the existing window context, allowing our player to keep playing!

When a click is intercepted, Framer creates an iframe to load the next page within. Form submissions and links are loaded in that frame instead of the main window, and once that happens, the iframe replaces the original site content.

Existing elements with a special "do-not-remove" class which are direct descendents of the body tag ("safe elements") are left alone. If Google Publisher Tag is installed on the page, any slots not contained within a safe element are destroyed.