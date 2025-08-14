---
sidebar_position: 2
---

import MicroserviceDiagram from "@site/src/components/MicroserviceDiagram";

# Architecture Proposal

## Making our own Riichi Mahjong Platform

The hope is to build an adaptable and complete platform for riichi mahjong play.

Given libmahjong's focus on bot play, we still want to continue that into the design of any later system.
Therefore, building out a lobby based queued match system, where we can pit bots against each other as well as support
player play (since we are building out the system anyways!) begins to solidify into this larger picture for us
to build. We can also take notes from the online chess ranked community for how we should manage bot ranking,
and playing against said bots.

The goal is to build this in a scalable, distributed manner, both to account for the need to run a bunch of bot
matches to build their matchmaking rank (MMR), improves resiliency, as well as for an exercise.

<MicroserviceDiagram />

## Service Components

All of the service components required (and any work currently done in the space)

**Note:** A lot of work was done out of curiosity, but everything can be subject to change.

### Frontend ([sth-frontend](https://github.com/realliance/sth-frontend))

Main user entry, where they can manage their account, play/review matches, and configure bots to build and host.

### Rough implementation trajectory

- Early focus will be on account management and the minimal implementation to be able to register, queue, and rank bots.
- From there, we should build in features to support match playback (to see how your bots acted).
- After, we can finally get player matches going, which will require building out a better user interaction model.

### Account API ([sth-account](https://github.com/realliance/sth-account))

API to manage frontend activity and track user activity. Your run of the mill RESTful backend. Owns the database.

### Account Workers ([sth-account](https://github.com/realliance/sth-account))

Same codebase as the account api (so a single codebase can own the database migrations and state).

Meant to consume incoming queue messages that mutate user and match state.

### Matchmaking Service ([parlor-room](https://github.com/realliance/parlor-room))

Meant to consume incoming match request message, and create lobbies based on user ranking.
Filled lobbies are then put back into the message queue to get spun up as a real match.

The current implementation of parlor-room also accounts for "All Bot" and "Mixed" lobbies, where mixed lobbies
has a timeout-backfill system where we can ask for matches to be filled with bots if not enough eligible users
are found.

### Game Runtime Pool ([super-gametable](https://github.com/realliance/super-gametable))

Consumes incoming match requests and runs the matches in pools using libmahjong.

Right now it supports as much as what libmahjong supports via the C API (matches with the embedded controllers).

Eventually we would allow some sort of network controller to be possible that can expose the
match loop into our service logic structure, eventually allow us to connect running bots and players alike to matches. This would take the shape of supporting controller registration through the C API layer.

### Game Interface Service (TBD)

This is a nebulous service concept of how we handle the "last mile" connection between a running match and the external world where players and bots live.
I imagine this roughly as some sort of server side event (WebSockets?) layer, where clients listen to events and then have to react against a POST endpoint for their decisions.

### Message Queue Backbone (RabbitMQ)

Per microservice best practices, we should try to keep things as loosely coupled as possible between services.

One of the best ways to do this is with message passing, and we can leverage open source mq brokers like rabbitmq
to handle this for us.

To better support the message passing, we need to [build out specs](https://github.com/realliance/libmahjong-specs) that can allow services to share message shapes easily.

### Account Database (PostgresDB)

Per the coupling concern mentioned before, the postgres db is focused by the account api and it's auxiliary workers.

There is an argument that we should _increase_ the sharding of the account api to have everything be separate (matchmaking, social, bots),
but there is a tradeoff to account for here in terms of service complexity for our small team and this platonic ideal.
