const { Util } = require('./lib')
const Trailpack = require('trailpack')

module.exports = class DesignFirstTrailpack extends Trailpack {

  /**
   *
   */
  validate() {
    return Util.parseSwaggerDefinition(this.app.config.swagger.swaggerDefinition)
      .then(definition => this.definitions = definition)
  }

  /**
   *
   */
  configure() {
    Util.setupSwaggerExposition(this.definitions, this.app)
    Util.setupApiFromDefinitions(this.definitions, this.app)
  }

  constructor(app) {
    super(app, {
      config: require('./config'),
      api: require('./api'),
      pkg: require('./package')
    })
  }
}

