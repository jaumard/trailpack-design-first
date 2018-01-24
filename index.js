const { Util } = require('./lib')
const Trailpack = require('trailpack')

module.exports = class DesignFirstTrailpack extends Trailpack {

  /**
   *
   */
  validate() {
    return Util.parseSwaggerDefinition(this.app.config.swagger.swaggerDefinition)
      .then(definition => this.definition = definition)
  }

  /**
   *
   */
  configure() {
    Util.setupSwaggerExposition(this.app)
    Util.setupApiFromDefinition(this.definition, this.app)
  }

  constructor(app) {
    super(app, {
      config: require('./config'),
      api: require('./api'),
      pkg: require('./package')
    })
  }
}

