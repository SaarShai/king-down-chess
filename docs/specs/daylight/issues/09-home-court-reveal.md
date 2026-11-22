# Play the court reveal on Daylight Home

Status: claimed

## Scope

Play one silent film each time the player opens Home. Select the film and
its still image from the size of the art area. Show the still at the end
and release the film. Keep the controls in their current order.

Show the still during load, when playback fails, and when motion is off.
Pause the film when the art area leaves the view or the page is hidden.
Keep the film in place when account data changes the Home controls.
Release the film when the player leaves Home.

Keep all three still images in the offline cache. Let the browser send
film and byte range requests directly to the server.

The deploy artifact check accepts the three stills in the solo launch
worker lists. It rejects films in these lists.
