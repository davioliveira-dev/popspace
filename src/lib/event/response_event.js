/**
  Represents an event that was triggered by a PeerEvent
*/
module.exports = class ResponseEvent {
  constructor(sourceMercuryEvent, payload, kind) {
    this._sourceMercuryEvent = sourceMercuryEvent
    this._data = {
      payload: payload,
      kind: kind || `${sourceMercuryEvent.kind()}.response`,
      request_id: sourceMercuryEvent.requestId()
    }
  }

  sourceKind() {
    return this._sourceMercuryEvent.kind()
  }

  kind() {
    return this._data.kind
  }

  mercuryEvent() {
    return this._sourceMercuryEvent
  }

  roomId() {
    return this._sourceMercuryEvent.roomId()
  }

  serialize() {
    const serialized = Object.assign({}, this._data)
    serialized.sender = {
      actor_id: this._sourceMercuryEvent.actorId(),
      session_id: this._sourceMercuryEvent.sessionId()
    }
    return serialized
  }
}
