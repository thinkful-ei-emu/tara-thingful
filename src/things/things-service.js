const xss = require('xss')
const Treeize = require('treeize')

const ThingsService = {
  getAllThings(db) {
    return db
      .from('thingful_things AS thg')
      .select(
        'thg.id',
        'thg.title',
        'thg.date_created',
        'thg.content',
        'thg.image',
        ...userFields,
        db.raw(
          `count(DISTINCT rev) AS number_of_reviews`
        ),
        db.raw(
          `AVG(rev.rating) AS average_review_rating`
        ),
      )
      .leftJoin(
        'thingful_reviews AS rev',
        'thg.id',
        'rev.thing_id',
      )
      .leftJoin(
        'thingful_users AS usr',
        'thg.user_id',
        'usr.id',
      )
      .groupBy('thg.id', 'usr.id')
  },

  getById(db, id) {
    return ThingsService.getAllThings(db)
      .where('thg.id', id)
      .first();
  },

  getReviewsForThing(db, thing_id) {
    return db
      .from('thingful_reviews AS rev')
      .select(
        'rev.id',
        'rev.rating',
        'rev.text',
        'rev.date_created',
        ...userFields,
      )
      .where('rev.thing_id', thing_id)
      .leftJoin(
        'thingful_users AS usr',
        'rev.user_id',
        'usr.id',
      )
      .groupBy('rev.id', 'usr.id')
  },

  serializeThing(thing) {

    return {
      id: thing.id,
      title: xss(thing.title),
      content: xss(thing.content),
      date_created: thing.date_created,
      image: thing.image,
      user: {
        id: thing['user:id'],
        user_name: thing['user:user_name'],
        full_name: thing['user:full_name'],
        nickname: thing['user:nickname'],
        date_created: thing['user:date_created'],
      },
      number_of_reviews: Number(thing.number_of_reviews) || 0,
      average_review_rating: Math.round(thing.average_review_rating) || 0,
    }
  },

  serializeThingReviews(reviews) {
    return reviews.map(this.serializeThingReview)
  },

  serializeThingReview(review) {
    const reviewTree = new Treeize()

    // Some light hackiness to allow for the fact that `treeize`
    // only accepts arrays of objects, and we want to use a single
    // object.
    const reviewData = reviewTree.grow([ review ]).getData()[0]

    return {
      id: reviewData.id,
      rating: reviewData.rating,
      thing_id: reviewData.thing_id,
      text: xss(reviewData.text),
      user: reviewData.user || {},
      date_created: reviewData.date_created,
    }
  },
}

const userFields = [
  'usr.id AS user:id',
  'usr.user_name AS user:user_name',
  'usr.full_name AS user:full_name',
  'usr.nickname AS user:nickname',
  'usr.date_created AS user:date_created',
  'usr.date_modified AS user:date_modified',
]

module.exports = ThingsService
