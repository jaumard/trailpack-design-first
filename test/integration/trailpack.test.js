const _ = require('lodash')
const assert = require('assert')
const supertest = require('supertest')

describe('Trailpack', () => {
  let request
  before(() => {
    request = supertest('http://localhost:3000')
  })

  describe('#configured', () => {
    it('should include swagger routes (Controllers) in app.config.routes', () => {
      const routes = global.app.config.routes

      assert.equal(routes.length, 22)
      assert(_.find(routes, { path: '/v2/pet/{petId}' }))
      assert(_.find(routes, { path: '/v2/pet' }))
    })
  })

  describe('routes validation', () => {
    describe('GET validation', () => {
      it('should validate pet::findPetsByStatus route and fail if missing header', done => {
        request
          .get('/v2/pet/findByStatus?status=[]')
          .expect(400)
          .expect(function (res) {
            assert.equal('"accept" is required', res.error.text)
          })
          .end((err, res) => {
            done(err)
          })
      })

      it('should validate pet::findPetsByStatus route and fail if missing status param', done => {
        request
          .get('/v2/pet/findByStatus')
          .set('Accept', 'application/json')
          .expect(400)
          .expect(function (res) {
            assert.equal('"status" is required', res.body.message)
            assert.equal('child "query" fails because [child "status" fails because ["status" is required]]', res.body.name)
          })
          .end((err, res) => {
            done(err)
          })
      })

      it('should validate pet::findPetsByStatus route and fail if wrong status', done => {
        request
          .get('/v2/pet/findByStatus?status=ko')
          .set('Accept', 'application/json')
          .expect(400)
          .expect(function (res) {
            assert.equal('"status" must be an array', res.body.message)
            assert.equal('child "query" fails because [child "status" fails because ["status" must be an array]]', res.body.name)
          })
          .end((err, res) => {
            done(err)
          })
      })

      it('should validate pet::findPetsByStatus route and success', done => {
        request
          .get('/v2/pet/findByStatus?status=[]')
          .set('Accept', 'application/json')
          .expect(200)
          .end((err, res) => {
            done(err)
          })
      })
    })
    describe('POST validation', () => {
      it('should validate pet::findPetsByStatus route and fail by missing param', done => {
        request
          .post('/v2/pet')
          .set('Accept', 'application/json')
          .set('Content-type', 'application/json')
          .send({
            name: 'ok'
          })
          .expect(400)
          .expect(function (res) {
            assert.equal('"photoUrls" is required', res.body.message)
            assert.equal('child "body" fails because [child "photoUrls" fails because ["photoUrls" is required]]', res.body.name)
          })
          .end((err, res) => {
            done(err)
          })
      })
      it('should validate pet::findPetsByStatus route and fail by wrong type param', done => {
        request
          .post('/v2/pet')
          .set('Accept', 'application/json')
          .set('Content-type', 'application/json')
          .send({
            name: 'ok',
            photoUrls: 'ko'
          })
          .expect(400)
          .expect(function (res) {
            assert.equal('"photoUrls" must be an array', res.body.message)
            assert.equal('child "body" fails because [child "photoUrls" fails because ["photoUrls" must be an array]]', res.body.name)
          })
          .end((err, res) => {
            done(err)
          })
      })
      it('should validate pet::findPetsByStatus route and success', done => {
        request
          .post('/v2/pet')
          .set('Accept', 'application/json')
          .set('Content-type', 'application/json')
          .send({
            name: 'ok',
            photoUrls: []
          })
          .expect(200)
          .end((err, res) => {
            done(err)
          })
      })
    })
  })

  describe('swagger http exposition', () => {
    it('should expose swagger definition files on /swagger', done => {
      request
        .get('/swagger')
        .expect(200)
        .end((err, res) => {
          done(err)
        })
    })
    it('should expose swagger ui files on /swagger-ui', done => {
      request
        .get('/swagger-ui/ui.js')
        .expect(200)
        .end((err, res) => {
          done(err)
        })
    })
  })
})
