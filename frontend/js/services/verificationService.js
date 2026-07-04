/**
 * User Verification Service
 * Handles ID verification, admin approval, and trust scores
 */

const VerificationService = {

    // Verification statuses
    STATUS: {
        NONE: 'none',
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected'
    },

    // ID Types
    ID_TYPES: {
        AADHAAR: 'aadhaar',
        PAN: 'pan',
        LICENSE: 'license',
        PASSPORT: 'passport'
    },

    // Trust scores
    TRUST_SCORES: {
        none: 0,
        pending: 25,
        approved: 75,
        premium: 100
    },

    /**
     * Submit verification request
     */
    async submitVerification(userId, verificationData) {
        try {
            const submission = {
                userId: userId,
                verificationStatus: this.STATUS.PENDING,
                verificationData: {
                    idType: verificationData.idType,
                    idNumber: this.maskIDNumber(verificationData.idNumber, verificationData.idType),
                    idPhotoFront: verificationData.photoFront,
                    idPhotoBack: verificationData.photoBack || null,
                    submittedAt: new Date().toISOString(),
                    verifiedAt: null,
                    verifiedBy: null,
                    rejectionReason: null
                },
                trustScore: this.TRUST_SCORES.pending,
                verificationHistory: [
                    {
                        action: 'submitted',
                        timestamp: new Date().toISOString(),
                        details: `${verificationData.idType} verification submitted`
                    }
                ]
            };

            // In production: POST to API
            // const response = await fetch('/api/verifications', {
            //     method: 'POST',
            //     body: JSON.stringify(submission)
            // });

            // For now: Save to localStorage
            const verifications = this.getAllVerifications();
            verifications[userId] = submission;
            localStorage.setItem('userVerifications', JSON.stringify(verifications));

            // Update user state
            AppState.updateUserVerification({
                status: this.STATUS.PENDING,
                trustScore: this.TRUST_SCORES.pending
            });

            console.log('✅ Verification submitted:', submission);
            return { success: true, data: submission };

        } catch (error) {
            console.error('❌ Verification submission failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user verification status
     */
    getUserVerification(userId) {
        const verifications = this.getAllVerifications();
        return verifications[userId] || null;
    },

    /**
     * Get all verifications (admin only)
     */
    getAllVerifications() {
        try {
            const data = localStorage.getItem('userVerifications');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading verifications:', error);
            return {};
        }
    },

    /**
     * Get pending verifications (admin only)
     */
    getPendingVerifications() {
        const all = this.getAllVerifications();
        return Object.entries(all)
            .filter(([_, v]) => v.verificationStatus === this.STATUS.PENDING)
            .map(([userId, verification]) => ({ userId, ...verification }));
    },

    /**
     * Approve verification (admin only)
     */
    async approveVerification(userId, adminId) {
        try {
            const verifications = this.getAllVerifications();
            const verification = verifications[userId];

            if (!verification) {
                throw new Error('Verification not found');
            }

            verification.verificationStatus = this.STATUS.APPROVED;
            verification.verificationData.verifiedAt = new Date().toISOString();
            verification.verificationData.verifiedBy = adminId;
            verification.trustScore = this.TRUST_SCORES.approved;
            verification.verificationHistory.push({
                action: 'approved',
                timestamp: new Date().toISOString(),
                details: `Approved by admin ${adminId}`
            });

            verifications[userId] = verification;
            localStorage.setItem('userVerifications', JSON.stringify(verifications));

            console.log('✅ Verification approved for user:', userId);
            return { success: true, data: verification };

        } catch (error) {
            console.error('❌ Approval failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Reject verification (admin only)
     */
    async rejectVerification(userId, adminId, reason) {
        try {
            const verifications = this.getAllVerifications();
            const verification = verifications[userId];

            if (!verification) {
                throw new Error('Verification not found');
            }

            verification.verificationStatus = this.STATUS.REJECTED;
            verification.verificationData.rejectionReason = reason;
            verification.trustScore = this.TRUST_SCORES.none;
            verification.verificationHistory.push({
                action: 'rejected',
                timestamp: new Date().toISOString(),
                details: `Rejected by admin ${adminId}: ${reason}`
            });

            verifications[userId] = verification;
            localStorage.setItem('userVerifications', JSON.stringify(verifications));

            console.log('❌ Verification rejected for user:', userId);
            return { success: true, data: verification };

        } catch (error) {
            console.error('❌ Rejection failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mask ID number for privacy
     */
    maskIDNumber(idNumber, idType) {
        if (!idNumber) return '';

        // Remove spaces and dashes
        const clean = idNumber.replace(/[\s-]/g, '');

        switch (idType) {
            case this.ID_TYPES.AADHAAR:
                // Show last 4 digits: XXXX-XXXX-1234
                return `XXXX-XXXX-${clean.slice(-4)}`;

            case this.ID_TYPES.PAN:
                // Show last 4 characters: XXXXX1234
                return `XXXXX${clean.slice(-4)}`;

            case this.ID_TYPES.LICENSE:
                // Show last 4: XXXXXXX1234
                return `XXXXXXX${clean.slice(-4)}`;

            case this.ID_TYPES.PASSPORT:
                // Show last 4: XXXX1234
                return `XXXX${clean.slice(-4)}`;

            default:
                return `XXXX${clean.slice(-4)}`;
        }
    },

    /**
     * Format ID number for display
     */
    formatIDNumber(idNumber, idType) {
        if (!idNumber) return '';

        const clean = idNumber.replace(/[\s-]/g, '');

        switch (idType) {
            case this.ID_TYPES.AADHAAR:
                // Format: XXXX-XXXX-XXXX
                return clean.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');

            case this.ID_TYPES.PAN:
                // Format: ABCDE1234F (no formatting needed)
                return clean.toUpperCase();

            default:
                return clean;
        }
    },

    /**
     * Validate ID number format
     */
    validateIDNumber(idNumber, idType) {
        const clean = idNumber.replace(/[\s-]/g, '');

        switch (idType) {
            case this.ID_TYPES.AADHAAR:
                // 12 digits
                return /^\d{12}$/.test(clean);

            case this.ID_TYPES.PAN:
                // 10 alphanumeric: ABCDE1234F
                return /^[A-Z]{5}\d{4}[A-Z]{1}$/.test(clean.toUpperCase());

            case this.ID_TYPES.LICENSE:
                // Variable format, just check not empty
                return clean.length >= 10;

            case this.ID_TYPES.PASSPORT:
                // 8 alphanumeric
                return /^[A-Z0-9]{8}$/.test(clean.toUpperCase());

            default:
                return clean.length > 0;
        }
    },

    /**
     * Get verification badge HTML
     */
    getBadgeHTML(status) {
        switch (status) {
            case this.STATUS.APPROVED:
                return `
                    <div class="verification-badge verified">
                        <span class="badge-icon">✓</span>
                        <span class="badge-text">Verified</span>
                    </div>
                `;

            case this.STATUS.PENDING:
                return `
                    <div class="verification-badge pending">
                        <span class="badge-icon">⏳</span>
                        <span class="badge-text">Pending</span>
                    </div>
                `;

            case this.STATUS.REJECTED:
                return `
                    <div class="verification-badge rejected">
                        <span class="badge-icon">×</span>
                        <span class="badge-text">Rejected</span>
                    </div>
                `;

            default:
                return `
                    <div class="verification-badge none">
                        <span class="badge-icon">?</span>
                        <span class="badge-text">Not Verified</span>
                    </div>
                `;
        }
    },

    /**
     * Get trust score display
     */
    getTrustScoreDisplay(score) {
        if (score >= 75) {
            return { level: 'High', color: 'green', emoji: '🌟' };
        } else if (score >= 25) {
            return { level: 'Medium', color: 'yellow', emoji: '⭐' };
        } else {
            return { level: 'Low', color: 'gray', emoji: '☆' };
        }
    },

    /**
     * Check if user can perform action based on verification
     */
    canPerformAction(userId, action) {
        const verification = this.getUserVerification(userId);
        const status = verification ? verification.verificationStatus : this.STATUS.NONE;

        const permissions = {
            [this.STATUS.NONE]: {
                maxProperties: 1,
                canContact: true,
                priorityListing: false
            },
            [this.STATUS.PENDING]: {
                maxProperties: 2,
                canContact: true,
                priorityListing: false
            },
            [this.STATUS.APPROVED]: {
                maxProperties: Infinity,
                canContact: true,
                priorityListing: true
            }
        };

        return permissions[status] || permissions[this.STATUS.NONE];
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.VerificationService = VerificationService;
}
