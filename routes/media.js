const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64')
const base64Img = require('base64-img')
const fs = require('fs')

// call Media model
const {Media} = require('../models')


// GET image
router.get('/', async (req, res) => {
  const media = await Media.findAll({
    attributes: ['id', 'image']
  })

  // make beauty source image
  const mappedImage = media.map((m) => {
    m.image = `${req.get('host')}/${m.image}`

    return m
  })

  return res.json({
    status: "success",
    data: mappedImage
  })
})

// POST image
router.post('/', (req, res, next) => {
  const image = req.body.image

  // validasi apakah base64 atau bukan
  if(!isBase64(image, {mimeRequired: true})) {
    return res.status(400).json({
      status: "error",
      message: "Invalid Base64"
    })
  }

  // upload image to directory
  base64Img.img(image, 'public/images', Date.now(), async (err, filepath) => {
    // check error
    if(err) {
      return res.status(400).json({
        status: "error",
        message: err.message
      })
    }

    // get file name
    const filename = filepath.split('/').pop()

    // save to table media in db
    const image = await Media.create({image: `images/${filename}`})

    // return success
    return res.json({
      status: "success",
      message: "Success Upload Image",
      data: {
        id: image.id,
        image: `${req.get('host')}/images/${filename}`
      }
    })
  })
});

// DELETE image
router.delete('/:id', async (req, res) => {
  const id = req.params.id

  // check image
  const media = await Media.findByPk(id)

  // check jika ID tidak ditemukan
  if(!media) {
    return res.status(400).json({
      status: "error",
      message: "Media not found"
    })
  }

  // delete file media di dir
  fs.unlink(`./public/${media.image}`, async (err) => {
    if(err) {
      return res.status(400).json({
        status: "error",
        message: err.message
      })
    }

    // delete data in table DB
    await media.destroy()

    return res.json({
      status: "success",
      message: "Image deleted"
    })
  })

})

module.exports = router;
