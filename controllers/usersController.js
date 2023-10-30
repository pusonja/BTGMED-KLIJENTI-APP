const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require ('bcrypt')

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req,res) => {
    const users = await User.find().select('-password').lean()
    if(!users) {
        return res.status(400).json({ message: 'Ne postoji korisnik!'})
    }
    res.json(users)
})

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req,res) => {
    const { username, password, roles} = req.body

    //Confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: 'Sva polja obavezna!'})
    }

    //Check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Korisnicko ime vec postoji!'})
    }

    //Hash password
    const hashedPwd = await bcrypt.hash(password, 10) // salt rounds

    const userObject = { username, "password": hashedPwd, roles}

    //Create and store new user
    const user = await User.create(userObject)

    if (user) { //created
        res.status(201).json({ message: 'Novi korisnik ${username} kreiran'}) 
    } else {
        res.status(400).json({ message:'Nepravilni korisnicki podaci'})
    }
})

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req,res) => {
    const { id, username, roles, active, status, password} = req.body

    // Confirm data
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !=='boolean') {
        return res.status(400).json({ message:'Sva polja su obavezna!'})
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ message:'Korisnik nije pronadjen!'})
    }

    // Check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()
    // Allow updates for the original user
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message:'Duplo korisnicko ime'})
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password) {
        //Hash password
        user.password = await bcrypt.hash(password, 10) //salt rounds
    }

    const updateUser =  await user.save()

    res.json({ message:'${updateUser.username} updated'})
})

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req,res) => {
    const { id } = req.body

    if (!id) {
        return res.status(400).json({ message:'User ID potreban!'})
    }

    const notes = await Note.findOne({ user: id }).lean().exec()
    if (notes?.lenght) {
        return res.status(400).json({ message:'Korisnik je unosio podatke!'})
    }

    const user = await User.findById(id).exec()

    if (!user) {
        return res.status.json({ message:'Korisnik nije pronadjen!'})
    }
    
    const result = await user.deleteOne()

    const reply = 'Korisnik ${result.username} sa ID ${result._id} je obrisan!'

    res.json(reply)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}