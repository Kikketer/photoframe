## Prime Photo Frame (web)
This is my web version of the prime photo frame that I attempted to build with an android build environment.

It's super basic, a website that shows the time.  The background images rotate based on what the server directory has.  However you load these images is up to you, I'm going to have a copy of photos from Prime Photos.

I have a blog post about this application: http://cjweed.com/2018/02/03/Making-Android-Clocks/.

With this I've included my work around making the odrive agent work with Node.  To run the sync agent yourself you will want to install odrive and follow the typical CLI instructions, found here: https://docs.odrive.com/v1.0/docs/odrive-sync-agent#section--using-odrive-sync-agent-

Then you can run the node script to load images:

```
node photoframe/scripts/refresh-photos.js "/home/pi/odrive/Amazon Cloud Drive/Pictures/" "/home/pi/photoframe/public/photostore/" /home/pi/.odrive-agent/bin/odrive.py
```

This is pure side project so there are some refactorings I'd like to do but for now it works.