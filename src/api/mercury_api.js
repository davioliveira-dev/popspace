const Api = require("./api")
const http = require("./http")
const routes = require('./routes')

class MercuryApi {
  constructor(mercury) {
    this.mercury = mercury
    this.api = new Api(mercury.getExpress())
    this.initPostRoutes()
  }

  initPostRoutes() {
    this.api.loggedOutGetEndpoint("/hello", async (req, res) => {
      http.succeed(req, res, {hello: 'world'})
    })

    /*
      There's a lot of repetition here.

      What are we going to do about it? I don't want to make a decision yet.

      There is a standard way of dealing with this in Rails that we could mirror.
      The js equivalent would be something like requireOwner(), requireMember() -
      but they'd have to throw exceptions, and we'd have to catch them... it would
      be quite verbose - there's no language support that I'm aware of.

      Another alternative is to have a zoo of endpoints types that have certain prerequisites,
      so it'd be more like ownerEndpoint((req, res) => ()), memberEndpoint(...), ...
    **/
    this.api.loggedInPostEndpoint("/enable_public_invite_link", async (req, res) => {
      if(!req.body.room_id) {
        log.error.error(`Invalid enable_public_invite_link request ${JSON.stringify(req.user)}`)
        return http.fail(req, res, "Must provide room_id", {errorCode: shared.error.code.INVALID_API_PARAMS})
      }
      const room = await shared.db.rooms.roomById(req.body.room_id)
      if(!room) {
        return http.fail(req, res, "Unknown room", {errorCode: shared.error.code.UNKNOWN_ROOM})
      }
      if(req.user.id != room.owner_id) {
        return http.fail(req, res, "Insufficient permission", {errorCode: shared.error.code.PERMISSION_DENIED})
      }
      const inviteRouteEntry = await shared.db.room.invites.enablePublicInviteUrl(req.body.room_id)
      const inviteRoute = routes.publicInviteRoute(inviteRouteEntry.otp)
      http.succeed(req, res, { inviteRoute })
    })

    this.api.loggedInPostEndpoint("/get_public_invite_routes", async (req, res) => {
      if(!req.body.room_id) {
        log.error.error(`Invalid enable_public_invite_link request ${JSON.stringify(req.user)}`)
        return http.fail(req, res, "Must provide room_id", {errorCode: shared.error.code.INVALID_API_PARAMS})
      }
      const room = await shared.db.rooms.roomById(req.body.room_id)
      if(!room) {
        return http.fail(req, res, "Unknown room", {errorCode: shared.error.code.UNKNOWN_ROOM})
      }
      const canGetRoute = await shared.db.room.permissions.isMemberOrOwner(req.user, room)
      if(!canGetRoute) {
        return http.fail(req, res, "Insufficient permission", {errorCode: shared.error.code.PERMISSION_DENIED})
      }
      const routeEntries = await shared.db.room.invites.getActivePublicInviteUrls(req.body.room_id)
      const routesList = routeEntries.map((entry) => (routes.publicInviteRoute(entry.otp)))
      http.succeed(req, res, { routes: routesList })
    })

    this.api.loggedInPostEndpoint("/disable_public_invite_link", async (req, res) => {
      if(!req.body.room_id) {
        log.error.error(`Invalid enable_public_invite_link request ${JSON.stringify(req.user)}`)
        return http.fail(req, res, "Must provide room_id", {errorCode: shared.error.code.INVALID_API_PARAMS})
      }
      const room = await shared.db.rooms.roomById(req.body.room_id)
      if(!room) {
        return http.fail(req, res, "Unknown room", {errorCode: shared.error.code.UNKNOWN_ROOM})
      }
      if(req.user.id != room.owner_id) {
        return http.fail(req, res, "Insufficient permission", {errorCode: shared.error.code.PERMISSION_DENIED})
      }
      const result = await shared.db.room.invites.disablePublicInviteUrl(req.body.room_id)
      http.succeed(req, res)
    })
  }

}

module.exports = MercuryApi
