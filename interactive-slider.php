<?php
/*
    Plugin Name: Interactive Slider
    Plugin URI: http://wp-developer.pl/interactive-slider
    Description: Interactive Slider is an easy way to generate image slider ( with posts excerpt's scroller as a navigation panel ) based on the Wordpress posts.
    Author: mariusz-webdeveloper
    Version: 1.0.2
    License: GPLv2
*/

/*  Copyright 2014  Mariusz  (email : mariusz@wp-developer.pl)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as 
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

if ( ! defined( 'ABSPATH' ) ) { exit(); }

register_activation_hook( 'interactive-slider/interactive-slider.php', array( 'Interactive_Slider', 'activate' ) );
register_deactivation_hook( 'interactive-slider/interactive-slider.php', array( 'Interactive_Slider', 'deactivate' ) );
register_uninstall_hook( 'interactive-slider/interactive-slider.php', array( 'Interactive_Slider', 'uninstall' ) );

add_action( 'plugins_loaded', array( 'Interactive_Slider', 'init' ) );
class Interactive_Slider {

	const VERSION = '1.0.2';
	const CSCROLLER_VERSION = '1.0.0';
	const IASLIDER_VERSION = '1.0.0';
	const TOAST_VERSION = '1.0.0';
	const FOUNDATION_ICONS_VERSION = '3.0';

	const AJAX_ACTION_IDENT = 'interactive_slider_ajax';
	const AJAX_ACTION_CSCROLLER = 'cscroller';
	const AJAX_ACTION_IASLIDER = 'iaslider';

	protected $_dirs;
	protected $_urls;

	private static $_instance = null;

	private $_scripts_loaded = false;
	private $_extra_scripts_data_handles = array();
	private $_slider_instance_data = array();

	private function __construct() {

		$plugin_dir = dirname( __FILE__ );
		$vendors_dir = $plugin_dir . '/vendors';
		$iaslider_dir = $vendors_dir . '/iaSlider';
		$cscroller_dir = $vendors_dir . '/cScroller';
		$this->_dirs = array(

			'plugin'    => $plugin_dir,
			'vendors'   => $vendors_dir,
			'iaslider'  => $iaslider_dir,
			'cscroller' => $cscroller_dir,

		);

		$plugin_url = rtrim( plugin_dir_url( __FILE__ ), '/' );
		$vendors_url = $plugin_url . '/vendors';
		$iaslider_url = $vendors_url . '/iaSlider';
		$cscroller_url = $vendors_url . '/cScroller';
		$this->_urls = array(

			'plugin'    => $plugin_url,
			'vendors'   => $vendors_url,
			'iaslider'  => $iaslider_url,
			'cscroller' => $cscroller_url,

		);

	}

	public static function init() {

		if ( is_null( self::$_instance ) ) {

			self::$_instance = new Interactive_Slider();

		}

		$is_deactivation = false;
		if ( isset( $_REQUEST['action'] ) && 'deactivate' == $_REQUEST['action'] &&
				isset( $_REQUEST['plugin'] ) && 'interactive-slider.php' == basename( $_REQUEST['plugin'] ) ) {

			$is_deactivation = true;

		}

		if ( ! $is_deactivation ) {

			self::$_instance->_slider_instance_data = (array) self::$_instance->_get_slider_data();
			if ( ! isset( self::$_instance->_slider_instance_data['first_init_time'] ) ) {

				self::$_instance->_slider_instance_data['first_init_time'] = time();

			}

			add_shortcode( 'interactive_slider', array( self::$_instance, 'handle_shortcode' ) );
			add_action( 'init', array( self::$_instance, 'handle_ajax' ) );
			add_action( 'shutdown', array( self::$_instance, 'shutdown' ) );

		}

	}

	public function shutdown() {

		$this->_set_slider_data( $this->_slider_instance_data );

	}

	public static function activate() {

		$archive = get_option( 'interactive-slider-archive', array() );
		if ( empty( $archive ) ) {

			$archive = array( 'featured_images_ids' => array(), 'empty_images_paths' => array() );

		}
		update_option( 'interactive-slider-archive', $archive );

	}

	public static function deactivate() {

		$current_filter = current_filter();
		$current_filter_parts = (array) explode( '_', $current_filter, 2 );
		if ( 2 != count( $current_filter_parts ) || 
				'deactivate' != $current_filter_parts[0] || 
				'interactive-slider.php' != basename( $current_filter_parts[1] ) ) {

			return;

		}

		$archive = get_option( 'interactive-slider-archive', array() );

		// check if there are any images to clean up
		if ( isset( $archive['featured_images_ids'] ) && isset( $archive['empty_images_paths'] ) ) {

			$chunk_size = 100;

			$deactivate_time = time();
			$archive['clean_up_info'] = isset( $archive['clean_up_info'] ) ? $archive['clean_up_info'] : array();
			$archive['clean_up_info'][ $deactivate_time ] = array(

				'date'      => date( 'jS \of F Y h:i:s A', $deactivate_time ),
				'messages'  => array(),

			);

			$images_ids = $archive['featured_images_ids'];
			$number_of_images = count( $images_ids );
			for ( $i = 0 ; $i < $number_of_images ; $i = $i + $chunk_size ) {

				$images_to_clean_up = array_slice( $images_ids, $i, $chunk_size, true );

				$result = false;
				try {

					$result = self::$_instance->clean_up( $images_to_clean_up );

				} catch ( Exception $e ) {

					$result = $e;

				}

				if ( true === $result ) {

					$archive['featured_images_ids'] = array_diff_assoc( $archive['featured_images_ids'], $images_to_clean_up );

				} else {

					$archive['clean_up_info'][ $deactivate_time ]['messages'][] = array(

						'timestamp' => microtime(),
						'result'    => var_export( $result, true ),

					);

				}

			}

			$images_paths = $archive['empty_images_paths'];
			foreach ( $images_paths as $key => $filepath ) {

				$result = false;
				try {

					if ( is_readable( $filepath ) ) {

						$result = unlink( $filepath );

					} else {

						$result[] = 'file ' . $filepath . ' is not readable';

					}

				} catch ( Exception $e ) {

					$result = $e;

				}

				if ( true === $result ) {

					unset( $archive['empty_images_paths'][ $key ] );

				} else {

					$archive['clean_up_info'][ $deactivate_time ]['messages'][] = array(

						'timestamp' => microtime(),
						'result'    => var_export( $result, true ),

					);

				}

			}

			if ( empty( $archive['clean_up_info'][ $deactivate_time ]['messages'] ) ) {

				unset( $archive['clean_up_info'][ $deactivate_time ] );

			}

			update_option( 'interactive-slider-archive', $archive );

			if ( empty( $archive['featured_images_ids'] ) && empty( $archive['empty_images_paths'] ) &&
					empty( $archive['clean_up_info'] ) ) {

				delete_option( 'interactive-slider-archive' );
				delete_option( 'interactive-slider' );

			}

		}

	}

	public static function uninstall() {}

	/*
	 * clean up images metadata and delete appropriate images from /uploads folder
	 */
	private function clean_up( $images_to_clean_up ) {

		global $wpdb;

		$result = array();
		$sql_update_result = 0;

		$upload_dir = wp_upload_dir();
		$upload_base_dir = $upload_dir['basedir'];

		$sql_update_start = "UPDATE $wpdb->postmeta SET meta_value = CASE ";
		$sql_update = "";

		$sql_select = "SELECT post_id, meta_value FROM $wpdb->postmeta WHERE post_id IN (" . implode( ',', $images_to_clean_up ) . ") AND meta_key = '_wp_attachment_metadata';";
		$metadatas = $wpdb->get_results( $sql_select );

		foreach ( (array) $metadatas as $metadata ) {

			$id = $metadata->post_id;
			$image_metadata = maybe_unserialize( $metadata->meta_value );
			if ( ! isset( $image_metadata['file'] ) || ! isset( $image_metadata['sizes'] ) ) { continue; }

			$image_subdir = dirname( $image_metadata['file'] );
			foreach ( (array) $image_metadata['sizes'] as $size_name => $size_metadata ) {

				if ( 0 === strpos( $size_name, 'interactive-slider-' ) || 0 === strpos( $size_name, 'interactive-slider-thumbs-' ) ) {

					$filepath = $upload_base_dir . '/' . $image_subdir . '/' . $size_metadata['file'];
					if ( is_readable( $filepath ) ) {

						unlink( $filepath );

					} else {

						$result[] = 'file ' . $filepath . ' is not readable';

					}
					unset( $image_metadata['sizes'][ $size_name ] );

				}

			}
			$image_metadata = maybe_serialize( $image_metadata );
			$sql_update .= $wpdb->prepare( "WHEN post_id = $id THEN %s ", $image_metadata );

		}
		$sql_update_end = "END WHERE meta_key = '_wp_attachment_metadata';";

		if ( ! empty( $sql_update ) ) {

			$sql_update = $sql_update_start . $sql_update . $sql_update_end;
			$sql_update_result = $wpdb->query( $sql_update );
			if ( false === $sql_update_result ) {

				$result[] = 'there was a problem with SQL update query while updating wp attachements metadatas';

			}

		}

		return ! empty( $result ) ? $result : true;

	}

	private function _set_slider_data( $data ) {

		update_option( 'interactive-slider', $data );

	}

	private function _get_slider_data() {

		return get_option( 'interactive-slider', array() );

	}

	private function _load( $options ) {

		global $wp_scripts;

		$handle = 'interactive-slider-load-' . md5( $options['id'] );

		if ( ! $this->_scripts_loaded ) { $this->_load_scripts(); }

		$el_id = $options['id'];
		$width = $options['width'];
		$height = $options['height'];
		$scroller_width = $options['scroller_width'];
		$gap_between_slides_and_scroller = $options['gap_between_slides_and_scroller'];
		$wp_scripts->add( $handle, false );
		$wp_scripts->add_data( $handle, 'data', "interactiveSliderLoader.load( {

			interactiveSliderVersion    : '" . Interactive_Slider::VERSION . "',
			cScrollerVersion            : '" . Interactive_Slider::CSCROLLER_VERSION . "',
			iaSliderVersion             : '" . Interactive_Slider::IASLIDER_VERSION . "',
			foundationIconsVersion      : '" . Interactive_Slider::FOUNDATION_ICONS_VERSION . "',
			id                          : '" . $el_id . "',
			continousLoop               : '" . (boolean) $options['continous_loop'] . "',
			width                       : '" . $width . "',
			height                      : '" . $height . "',
			scrollerWidth               : '" . $scroller_width . "',
			gapBetweenSlidesAndScroller : '" . $gap_between_slides_and_scroller . "',
			speed                       : '" . (int) $options['scroller_speed'] . "',
			direction                   : '" . htmlentities( $options['scroller_direction'], ENT_QUOTES ) . "',
			dataUrl                     : '" . $options['data_url'] . "'

		} );" );
		$this->_extra_scripts_data_handles[] = $handle;

		$html = '<div class="ia-slider" id="' . esc_attr( $el_id ) . '" style="width:' . $width . 'px;height:' . $height . 'px;">
				 </div>';

		if ( $options['return'] ) { return $html; }

		echo $html;

	}

	private function _load_scripts() {

		add_action( 'wp_footer', array( $this, 'print_scripts' ) );

		wp_register_script( 'toast', $this->_urls['vendors'] . '/toast.js', null, Interactive_Slider::TOAST_VERSION );
		wp_register_script( 'interactive-slider-loader', $this->_urls['plugin'] . '/scripts/interactive-slider-loader.js', array( 'jquery', 'toast' ), Interactive_Slider::VERSION );

		$variables = array(

			'iaSliderBaseUrl'       => $this->_urls['iaslider'],
			'iaSliderRequestUrl'    => get_site_url() . '?' . Interactive_Slider::AJAX_ACTION_IDENT . '=' . Interactive_Slider::AJAX_ACTION_IASLIDER . '&request=',
			'cScrollerBaseUrl'      => $this->_urls['cscroller'],
			'cScrollerRequestUrl'   => get_site_url() . '?' . Interactive_Slider::AJAX_ACTION_IDENT . '=' . Interactive_Slider::AJAX_ACTION_CSCROLLER . '&request=',
			'vendorsBaseUrl'        => $this->_urls['vendors'],
			'pluginUrl'             => $this->_urls['plugin'],

		);

		wp_localize_script( 'interactive-slider-loader', 'interactiveSliderLoader', $variables );
		$this->_scripts_loaded = true;

	}

	public function handle_shortcode( $atts ) {

		$options = shortcode_atts( array(

			'id'                                => 'iaSlider',
			'continous_loop'                    => 'yes',
			'width'                             => 960,
			'height'                            => 360,
			'scroller_width'                    => 257,
			'gap_between_slides_and_scroller'   => 3,
			'scroller_speed'                    => 40,
			'scroller_direction'                => 'forward',
			'thumbs_width'                      => 70,
			'thumbs_height'                     => 70,
			'post_ids'                          => '',

		), $atts );

		$handle = 'interactive-slider-load-' . md5( $options['id'] );
		if ( in_array( $handle, $this->_extra_scripts_data_handles ) ) { return; }

		$post_ids = ! empty( $options['post_ids'] ) ? explode( ',', $options['post_ids'], 10 ) : array();
		array_walk( $post_ids, create_function( '$id', 'return (int) $id;' ) );

		$continous_loop = $options['continous_loop'] = 'yes' == $options['continous_loop'] ? true : false;
		$width = $options['width'] = (int) $options['width'];
		$width = $options['width'] = abs( $width );
		$height = $options['height'] = (int) $options['height'];
		$height = $options['height'] = abs( $height );
		$scroller_width = $options['scroller_width'] = (int) $options['scroller_width'];
		$scroller_width = $options['scroller_width'] = abs( $scroller_width );
		$gap_between_slides_and_scroller = $options['gap_between_slides_and_scroller'] = (int) $options['gap_between_slides_and_scroller'];
		$gap_between_slides_and_scroller = $options['gap_between_slides_and_scroller'] = abs( $gap_between_slides_and_scroller );
		$scroller_speed = $options['scroller_speed'] = (int) $options['scroller_speed'];
		$scroller_direction = $options['scroller_direction'] = in_array( $options['scroller_speed'], array( 'forward', 'backward' ) ) ? $options['scroller_speed'] : 'forward';
		$thumbs_width = $options['thumbs_width'] = (int) $options['thumbs_width'];
		$thumbs_width = $options['thumbs_width'] = abs( $thumbs_width );
		$thumbs_height = $options['thumbs_height'] = (int) $options['thumbs_height'];
		$thumbs_height = $options['thumbs_height'] = abs( $thumbs_height );
		$new_instance_options = array(

			'id'                                => $options['id'],
			'continous_loop'                    => $continous_loop,
			'post_ids'                          => $post_ids,
			'width'                             => $width,
			'height'                            => $height,
			'scroller_width'                    => $scroller_width,
			'gap_between_slides_and_scroller'   => $gap_between_slides_and_scroller,
			'scroller_speed'                    => $scroller_speed,
			'scroller_direction'                => $scroller_direction,
			'thumbs_width'                      => $thumbs_width,
			'thumbs_height'                     => $thumbs_height,
			'image_size_name'                   => 'interactive-slider-' . ( $width - $scroller_width - $gap_between_slides_and_scroller ) . 'x' . $height,
			'image_size_name_thumbs'            => 'interactive-slider-thumbs-' . $thumbs_width . 'x' . $thumbs_height,

		);
		$old_instance_options = (array) $this->_slider_instance_data[md5( $options['id'] )];
		$old_instance_options_updated = array_merge( $old_instance_options, $new_instance_options );
		if ( $old_instance_options_updated != $old_instance_options ) {

			$this->_slider_instance_data[md5( $options['id'] )] = $new_instance_options;

		}

		$options['data_url'] = get_site_url() .
								'?' . Interactive_Slider::AJAX_ACTION_IDENT . '=' . Interactive_Slider::AJAX_ACTION_CSCROLLER .
								'&request=data&slider-id=' . htmlentities( $options['id'], ENT_QUOTES );

		$options['return'] = true;
		return $this->_load( $options );

	}

	public function handle_ajax() {

		if ( isset( $_REQUEST[Interactive_Slider::AJAX_ACTION_IDENT] ) ) {

			$request = $_REQUEST['request'];

			$mode = 'raw'; // Or 'json' for JSON output
			$output = 'raw' == $mode ? '' : array();

			// Read and return data for requests from iaSlider script
			if ( Interactive_Slider::AJAX_ACTION_IASLIDER == $_REQUEST[Interactive_Slider::AJAX_ACTION_IDENT] ) {

				if ( '/templates/iaSlider.html' == $request ) {

					$output = file_get_contents( $this->_dirs['iaslider'] . $request );

				}

			}

			// Read and return data for requests from cScroller script
			if ( Interactive_Slider::AJAX_ACTION_CSCROLLER == $_REQUEST[Interactive_Slider::AJAX_ACTION_IDENT] ) {

				if ( 'data' == $request && isset( $_REQUEST['slider-id'] ) ) {

					$slider_el_id = $_REQUEST['slider-id'];
					$output = $this->_get_data( $slider_el_id );

				} elseif ( '/templates/cScroller.html' == $request ) {

					$output = file_get_contents( $this->_dirs['cscroller'] . $request );

				}

			}

			if ( 'json' == $mode ) {

				header('Content-type: application/json');
				$output = json_encode( $output );

				if ( isset( $_REQUEST['callback'] ) ) {

					$callback = htmlentities( $_REQUEST['callback'], ENT_QUOTES );
					$output = $callback . '(' . $output . ')';

				}

			}

			echo $output;
			$this->_set_slider_data( $this->_slider_instance_data );
			exit();

		}

	}

	public function image_downsize( $value, $id, $size ) {

		$slider_id = strlen( $size ) > 19 && 'interactive-slider-' == substr( $size, 0, 19 ) ? substr( $size, 19 ) : null;
		if ( empty( $slider_id ) ) { return false; }

		$min_size = false;
		if ( strlen( $size ) > 23 && 'interactive-slider-min-' == substr( $size, 0, 23 ) ) {

			$slider_id = substr( $size, 23 );
			$min_size = true;

		}

		$slider_instance = isset( $this->_slider_instance_data[ $slider_id ] ) ? $this->_slider_instance_data[ $slider_id ] : null;
		if ( empty( $slider_instance ) ) { return false; }

		$width = $min_size ? $slider_instance['thumbs_width'] : $slider_instance['width'] - $slider_instance['scroller_width'] - $slider_instance['gap_between_slides_and_scroller'];
		$height = $min_size ? $slider_instance['thumbs_height'] : $slider_instance['height'];

		$upload_dir = wp_upload_dir();
		$upload_base_dir = $upload_dir['basedir'];
		$image_metadata = wp_get_attachment_metadata( $id );
		$image_subdir = dirname( $image_metadata['file'] );
		$filename = basename( $image_metadata['file'] );
		$filepath = $upload_base_dir . '/' . $image_subdir . '/' . $filename;

		$size_name = $min_size ? $slider_instance['image_size_name_thumbs'] : $slider_instance['image_size_name'];
		$intermediate = image_get_intermediate_size( $id, $size_name );

		$make_intermediate = false;
		if ( false === $intermediate ) {

			$make_intermediate = true;

		} else {

			$filepath_intermediate = $upload_base_dir . '/' . $image_subdir . '/' . $intermediate['file'];
			if ( ! is_readable( $filepath_intermediate ) ) { $make_intermediate = true; }

		}

		if ( $make_intermediate ) {

			$intermediate = image_make_intermediate_size( $filepath, $width, $height, true );
			if ( ! is_array( $intermediate ) && ! isset( $intermediate['file'] ) ) { return false; }

			$image_metadata['sizes'][ $size_name ] = array(

				'file'      => $intermediate['file'],
				'width'     => $width,
				'height'    => $height,
				'mime-type' => $intermediate['mime-type'],

			);
			wp_update_attachment_metadata( $id, $image_metadata );

			$archive = get_option( 'interactive-slider-archive' );
			$archive['featured_images_ids'][ $id ] = $id;
			update_option( 'interactive-slider-archive', $archive );

		}

		$img_url = wp_get_attachment_url( $id );
		$img_url_basename = wp_basename( $img_url );
		$img_url = str_replace( $img_url_basename, $intermediate['file'], $img_url );
		$is_intermediate = true;

		return array( $img_url, $width, $height, $is_intermediate );

	}

	private function _get_data( $slider_id ) {

		$internal_id = md5( $slider_id );
		if ( ! isset($this->_slider_instance_data[ $internal_id ]) ) { return ''; }

		$slider_instance = $this->_slider_instance_data[ $internal_id ];
		$post_ids = (array) $slider_instance['post_ids'];

		$width = $slider_instance['width']  - $slider_instance['scroller_width'] - $slider_instance['gap_between_slides_and_scroller'];
		$height = $slider_instance['height'];
		$image_size_name = 'interactive-slider-' . $internal_id;

		$thumbs_width = $slider_instance['thumbs_width'];
		$thumbs_height = $slider_instance['thumbs_height'];
		$image_size_name_min = 'interactive-slider-min-' . $internal_id;

		add_filter( 'image_downsize', array( $this, 'image_downsize' ), null, 3 );

		if ( ! isset( $this->_slider_instance_data['empty_image_path'] ) || 
				! file_exists( $this->_slider_instance_data['empty_image_upload_dir']['path'] . '/' . basename( $this->_slider_instance_data['empty_image_path'] ) ) ) {

			$upload_dir = wp_upload_dir( date( 'Y/m', $this->_slider_instance_data['first_init_time'] ) );
			$empty_image_path = $this->_dirs['plugin'] . '/images/interactive-slider-empty.jpg';
			$empty_image_filename = basename( $empty_image_path );
			$empty_image_new_path = $upload_dir['path'] . '/' . $empty_image_filename;
			copy( $empty_image_path, $empty_image_new_path );
			$this->_slider_instance_data['empty_image_path'] = $empty_image_new_path;
			$this->_slider_instance_data['empty_image_upload_dir'] = $upload_dir;

			$archive = get_option( 'interactive-slider-archive' );
			$archive['empty_images_paths'][md5( $empty_image_new_path )] = $empty_image_new_path;
			update_option( 'interactive-slider-archive', $archive );

		}

		add_filter( 'the_content', create_function( '$content', 'return preg_replace( "/<[^>]+>/", "", $content );' ) );
		add_filter( 'excerpt_length', create_function( '$value', 'return 20;' ) );
		$data = '';
		$query = new WP_Query( array( 'post_type' => 'post', 'post__in' => $post_ids ) );
		if ( empty( $post_ids ) ) {
		
			$query = new WP_Query( array( 'post_type' => 'post', 'posts_per_page' => 10 ) );
		
		}
		while ( $query->have_posts() ) {

			$query->the_post();

			$post_thumbnail_id = get_post_thumbnail_id( $query->post->ID );

			$featured_image_thumbnail = wp_get_attachment_image_src( $post_thumbnail_id, $image_size_name_min );
			$featured_image_large = wp_get_attachment_image_src( $post_thumbnail_id, $image_size_name );

			$src_min = isset( $featured_image_thumbnail[0] ) ? $featured_image_thumbnail[0] : null;
			$src_min = empty( $src_min ) && isset( $slider_instance['empty_image_src_min'] ) ? $slider_instance['empty_image_src_min'] : $src_min;

			/* create resized ( min ) version of empty image
			 * first condition:  empty( $src_min ) - indicate that there is no 
			 *                   post thumbnail or that the empty image has not been yet resized and assigned,
			 *
			 * second condition: together with first condition evaluated to false - indicate 
			 *                   that there is no post thumbnail and that currently assigned 
			 *                   resized version of empty image is not readable for some reason ( maybe it has 
			 *                   been removed from the "uploads" folder )
			 */
			if ( empty( $src_min ) || ( empty( $post_thumbnail_id ) && 
				 ! is_readable( $this->_slider_instance_data['empty_image_upload_dir']['path'] . '/' . basename( $src_min ) ) ) ) {

				$intermediate = image_make_intermediate_size( $this->_slider_instance_data['empty_image_path'], $thumbs_width, $thumbs_height, true );
				$src_min = $this->_slider_instance_data['empty_image_upload_dir']['url'] . '/' . $intermediate['file'];
				$this->_slider_instance_data[ $internal_id ]['empty_image_src_min'] = $src_min;

				$archive = get_option( 'interactive-slider-archive' );
				$path_min = $this->_slider_instance_data['empty_image_upload_dir']['path'] . '/' . $intermediate['file'];
				$archive['empty_images_paths'][md5( $path_min )] = $path_min;
				update_option( 'interactive-slider-archive', $archive );

			}

			$src_large = isset( $featured_image_large[0] ) ? $featured_image_large[0] : null;
			$src_large = empty( $src_large ) && isset( $slider_instance['empty_image_src_large'] ) ? $slider_instance['empty_image_src_large'] : $src_large;

			/* create resized ( large ) version of empty image
			 * first condition:  empty( $src_large ) - indicate that there is no 
			 *                   post thumbnail or that the empty image has not been yet resized and assigned,
			 *
			 * second condition: together with first condition evaluated to false - indicate 
			 *                   that there is no post thumbnail and that currently assigned 
			 *                   resized version of empty image is not readable for some reason ( maybe it has 
			 *                   been removed from the "uploads" folder )
			 */
			if ( empty( $src_large ) || ( empty( $post_thumbnail_id ) && 
				 ! is_readable( $this->_slider_instance_data['empty_image_upload_dir']['path'] . '/' . basename( $src_large ) ) ) ) {

				$intermediate = image_make_intermediate_size( $this->_slider_instance_data['empty_image_path'], $width, $height, true );
				$src_large = $this->_slider_instance_data['empty_image_upload_dir']['url'] . '/' . $intermediate['file'];
				$this->_slider_instance_data[ $internal_id ]['empty_image_src_large'] = $src_large;

				$archive = get_option( 'interactive-slider-archive' );
				$path_large = $this->_slider_instance_data['empty_image_upload_dir']['path'] . '/' . $intermediate['file'];
				$archive['empty_images_paths'][md5( $path_large )] = $path_large;
				update_option( 'interactive-slider-archive', $archive );

			}

			$featured_image = '<img src="' . $src_min . '" data-largesrc="' . $src_large . '" width="' . $thumbs_width . '" height="' . $thumbs_height . '" />';

			$data .= '<div class="active-item post-id-' . get_the_ID() . '">' . "\n" . 
						'<h2><a href="' . get_permalink() . '" rel="bookmark">' . get_the_title() . '</a></h2>' . "\n" . 
						'<p>' . "\n" . 
							$featured_image . 
							get_the_excerpt() . 
						'</p>' . "\n" . 
						'<div class="clear">&nbsp;</div>' . "\n" . 
					 '</div>' . "\n";

		}
		remove_filter( 'the_content', create_function( '$content', 'return preg_replace( "/<[^>]+>/", "", $content );' ) );
		remove_filter( 'excerpt_length', create_function( '$value', 'return 20;' ) );

		$data = ! empty( $data ) ? $data : '<div class="active-item">No posts have been found for the given criteria.</div>';

		return $data;

	}

	public function print_scripts() {

		global $wp_scripts;

		$handles = array( 'interactive-slider-loader' );
		wp_print_scripts( $handles );

		foreach ( $this->_extra_scripts_data_handles as $handle ) {

			$wp_scripts->print_extra_script( $handle );

		}

	}

}

