/**
 * ==========================================
 * USER ROUTES
 * ==========================================
 * 
 * API endpoints for user management
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validateUserId, validateUserCreate } = require('../middleware/validation');

/**
 * @route   GET /api/user/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', verifyToken, validateUserId, async (req, res) => {
    try {
        const { id } = req.params;
        const { uid: requestingUserId } = req.user;

        // Users can only get their own profile unless they're admin
        const userDoc = await db.collection('users').doc(id).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userDoc.data();

        // Check if requesting user is viewing their own profile
        if (id !== requestingUserId) {
            // Return limited public data for other users
            return res.json({
                success: true,
                user: {
                    uid: userData.uid,
                    displayName: userData.displayName,
                    role: userData.role
                }
            });
        }

        // Return full data for own profile
        res.json({
            success: true,
            user: {
                uid: userData.uid,
                phone: userData.phone,
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                isActive: userData.isActive,
                createdAt: userData.createdAt,
                lastLogin: userData.lastLogin
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user'
        });
    }
});

/**
 * @route   PATCH /api/user/:id
 * @desc    Update user profile
 * @access  Private (own profile only)
 */
router.patch('/:id', verifyToken, validateUserId, validateUserCreate, async (req, res) => {
    try {
        const { id } = req.params;
        const { uid: requestingUserId } = req.user;

        // Users can only update their own profile
        if (id !== requestingUserId) {
            return res.status(403).json({
                success: false,
                error: 'You can only update your own profile'
            });
        }

        const { displayName, email } = req.body;
        const updates = {};

        if (displayName !== undefined) updates.displayName = displayName;
        if (email !== undefined) updates.email = email;

        // Update Firestore
        await db.collection('users').doc(id).update(updates);

        // Get updated user
        const updatedUserDoc = await db.collection('users').doc(id).get();
        const updatedUser = updatedUserDoc.data();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                uid: updatedUser.uid,
                phone: updatedUser.phone,
                email: updatedUser.email,
                displayName: updatedUser.displayName,
                role: updatedUser.role
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
});

/**
 * @route   GET /api/user
 * @desc    Get all users (admin only)
 * @access  Admin
 */
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { limit = 50, orderBy = 'createdAt', order = 'desc' } = req.query;

        const usersQuery = db.collection('users')
            .orderBy(orderBy, order)
            .limit(parseInt(limit));

        const snapshot = await usersQuery.get();
        const users = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            users.push({
                uid: data.uid,
                phone: data.phone,
                email: data.email,
                displayName: data.displayName,
                role: data.role,
                isActive: data.isActive,
                createdAt: data.createdAt,
                lastLogin: data.lastLogin
            });
        });

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get users'
        });
    }
});

/**
 * @route   DELETE /api/user/:id
 * @desc    Delete user (admin only or own account)
 * @access  Private
 */
router.delete('/:id', verifyToken, validateUserId, async (req, res) => {
    try {
        const { id } = req.params;
        const { uid: requestingUserId } = req.user;

        // Check if user can delete (own account or admin)
        if (id !== requestingUserId) {
            // Check if admin
            const userRecord = await require('../config/firebase').auth.getUser(requestingUserId);
            if (!userRecord.customClaims || !userRecord.customClaims.admin) {
                return res.status(403).json({
                    success: false,
                    error: 'You can only delete your own account'
                });
            }
        }

        // Delete from Firestore
        await db.collection('users').doc(id).delete();

        // Delete from Firebase Auth
        await require('../config/firebase').auth.deleteUser(id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
});

module.exports = router;
