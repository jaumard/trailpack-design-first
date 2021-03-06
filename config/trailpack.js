/**
 * Trailpack Configuration
 *
 * @see {@link http://trailsjs.io/doc/trailpack/config}
 */
module.exports = {

  lifecycle: {
    configure: {
      listen: ['trailpack:router:configured', 'trailpack:express:configured']
    }
  }
}
