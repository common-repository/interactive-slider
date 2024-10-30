=== Plugin Name ===
Contributors: mariusz-webdeveloper
Tags: interactive slider, slider, content scroller, scroller
Requires at least: 3.3
Tested up to: 3.8
Stable tag: 1.0.2
License: GPLv2
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Interactive Slider is an easy way to generate image slider ( with posts excerpt's scroller as a navigation panel ) based on the Wordpress posts.

== Description ==

Interactive Slider is an easy way to generate image slider based on the Wordpress posts. Sliders generated that way will features posts excerpt's scroller, 
which will serve as a navigation panel for slides.

Slider inclusion on a website is done by the Wordpress shortcode functionality. You can place it inside a post or page content or add it directly to a choosen file template.
To include it inside a particular file template, just add the following code somewhere inside the source code:

`<?php echo do_shortcode('[interactive_slider width="1040" height="250" scroller_width="257"]'); ?>`

"width", "height" and "scroller_width" are ones of the options you can set to configure the resulted slider instance.

= Here is a full list of possible options: =

* "id" [ HTML Element id, "iaSlider" by default ]  
 this will be the id of a container wrapping up the slider HTML elements. Should be unique if you want to include more then one slider per page,  
  
* "continous_loop" [ "yes" or "no", "yes" by default ]  
 tell the scroller whether to make copies of content to scroll them one after another in loop,  
  
* "width" [ in pixels, "960" by default ]  
 width of the slider,  
  
* "height" [ in pixels, "360" by default ]  
 height of the slider,  
  
* "scroller_width" [ in pixels, "257" by default ]  
 posts excerpt's scroller width,  
  
* "gap_between_slides_and_scroller" [ in pixels, "3" by default ]  
 gap between slides and scroller,  
  
* "scroller_speed" [ in pixels per second, "40" by default ]  
 posts excerpt's scroller scroll speed,  
  
* "scroller_direction" [ "forward" or "backward", "forward" by default ]  
 posts excerpt's scroller scroll direction,  
  
* "thumbs_width" [ in pixels, "70" by default ]  
 posts excerpt's featured image thumbnail width,  
  
* "thumbs_height" [ in pixels, "70" by default ]  
 posts excerpt's featured image thumbnail height,  
  
* "post_ids" [ separated by comma posts id's list, empty by default ]  
 posts ids to generate the slider from them. If empty, then 10 latest posts will be used instead.  
  
  
**NOTE**: the plugin does not have admin panel pages. All of its functionality is modified through the shortcode options mentioned above.
  
== Installation ==

1. Upload `interactive-slider` folder to the `/wp-content/plugins/` directory,
1. Activate the plugin through the 'Plugins' menu in WordPress,
1. Place `<?php echo do_shortcode('[interactive_slider option1="value1" option2="value2" etc. ]'); ?>` in your templates or
1. Place [interactive_slider option1="value1" option2="value2" etc. ] in your post/page content

== Frequently Asked Questions ==

= Why there is an empty image instead of a post related image? =

Slides are made by scalling down orginal images ( setted up as a featured images for posts ). If a post does not have
featured image setted up, then the default one ( empty image ) will be used.

= Why slider is loading so long? =

Slides are made by scalling down orginal images ( setted up as a featured images for posts ). 
First load of the slider on a website as well any later load ( after options was changed, e.g. after width or height was changed ) will
require the plugin to generate scalled version of the orginal images and this may take a while.  
  
However after the scalled version is generated, the slider should load quite fast ( as all the images should fit the slider dimensions )  
  
= How can I change default empty image for posts without its own featured image? =

Replace the interactive-slider/images/intractive-slider-empty.jpg image with your own image. Deactivate and activate plugin for changes to take effect.  
  
== Screenshots ==

1. Slider with featured posts in a website header  
  
== Changelog ==
  
= 1.0.2 =
* CSS correction.  
* SVN /tags subdirectory layout correction.  
* Tested up the plugin with different Wordpress versions.  
  
= 1.0.1 =
* Move the plugin screenshot to /assets subdirectory.  
  
