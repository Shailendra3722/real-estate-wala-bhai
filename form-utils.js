/**
 * Form Utilities for Property Listing
 * Handles autosave, navigation, progress, and validation
 */

const FormUtils = {
    // Configuration
    AUTOSAVE_DELAY: 1500, // 1.5 seconds
    TOTAL_STEPS: 6,

    // State
    autosaveTimer: null,
    currentStep: 1,

    /**
     * Initialize form utilities
     */
    init() {
        this.loadDraft();
        this.setupAutosave();
        console.log('📋 Form utilities initialized');
    },

    /**
     * Autosave form data
     */
    autosave(step, data) {
        clearTimeout(this.autosaveTimer);

        this.autosaveTimer = setTimeout(() => {
            try {
                // Get existing draft
                const draft = this.getDraft();

                // Update step data
                draft[`step${step}`] = data;
                draft.lastSaved = new Date().toISOString();
                draft.currentStep = step;

                // Save to localStorage
                localStorage.setItem('propertyDraft', JSON.stringify(draft));

                // Show save indicator
                this.showSaveIndicator('saved');

                console.log(`💾 Autosaved step ${step}:`, data);
            } catch (error) {
                console.error('❌ Autosave failed:', error);
                this.showSaveIndicator('error');
            }
        }, this.AUTOSAVE_DELAY);

        // Show saving indicator immediately
        this.showSaveIndicator('saving');
    },

    /**
     * Load draft from localStorage
     */
    loadDraft() {
        try {
            const draft = localStorage.getItem('propertyDraft');
            return draft ? JSON.parse(draft) : this.getEmptyDraft();
        } catch (error) {
            console.error('❌ Load draft failed:', error);
            return this.getEmptyDraft();
        }
    },

    /**
     * Get draft object
     */
    getDraft() {
        const draft = localStorage.getItem('propertyDraft');
        return draft ? JSON.parse(draft) : this.getEmptyDraft();
    },

    /**
     * Get empty draft structure
     */
    getEmptyDraft() {
        return {
            step1: {},
            step2: {},
            step3: {},
            step4: {},
            step5: {},
            step6: {},
            lastSaved: null,
            currentStep: 1
        };
    },

    /**
     * Clear draft
     */
    clearDraft() {
        localStorage.removeItem('propertyDraft');
        console.log('🗑️ Draft cleared');
    },

    /**
     * Setup autosave listeners
     */
    setupAutosave() {
        // Listen for form changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                const step = this.getCurrentStepNumber();
                const formData = this.collectCurrentStepData();
                this.autosave(step, formData);
            }
        });
    },

    /**
     * Collect current step data
     */
    collectCurrentStepData() {
        const formData = {};
        const form = document.querySelector('form');

        if (!form) return formData;

        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                if (input.checked) {
                    formData[input.name] = input.value;
                }
            } else {
                formData[input.name] = input.value;
            }
        });

        return formData;
    },

    /**
     * Get current step number from URL or page
     */
    getCurrentStepNumber() {
        const url = window.location.pathname;
        const match = url.match(/step(\d)/);
        return match ? parseInt(match[1]) : 1;
    },

    /**
     * Show save indicator
     */
    showSaveIndicator(status) {
        let indicator = document.getElementById('autosaveIndicator');

        if (!indicator) {
            // Create indicator if it doesn't exist
            indicator = document.createElement('div');
            indicator.id = 'autosaveIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 0.5rem 1rem;
                border-radius: 25px;
                font-size: 0.85rem;
                font-weight: 600;
                z-index: 9999;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }

        if (status === 'saving') {
            indicator.textContent = '💾 Saving...';
            indicator.style.background = 'rgba(251, 191, 36, 0.95)';
            indicator.style.color = '#78350f';
            indicator.style.opacity = '1';
        } else if (status === 'saved') {
            indicator.textContent = '✓ Saved';
            indicator.style.background = 'rgba(34, 197, 94, 0.95)';
            indicator.style.color = '#14532d';
            indicator.style.opacity = '1';

            // Fade out after 2 seconds
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 2000);
        } else if (status === 'error') {
            indicator.textContent = '⚠️ Save failed';
            indicator.style.background = 'rgba(239, 68, 68, 0.95)';
            indicator.style.color = '#7f1d1d';
            indicator.style.opacity = '1';
        }
    },

    /**
     * Navigate to step
     */
    goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > this.TOTAL_STEPS) {
            console.error('Invalid step number:', stepNumber);
            return;
        }

        window.location.href = `add-property-step${stepNumber}.html`;
    },

    /**
     * Go to next step
     */
    nextStep() {
        const currentStep = this.getCurrentStepNumber();

        // Validate current step
        if (!this.validateCurrentStep()) {
            return;
        }

        // Save current step data
        const formData = this.collectCurrentStepData();
        this.autosave(currentStep, formData);

        // Navigate to next step
        if (currentStep < this.TOTAL_STEPS) {
            setTimeout(() => {
                this.goToStep(currentStep + 1);
            }, 500);
        }
    },

    /**
     * Go to previous step
     */
    previousStep() {
        const currentStep = this.getCurrentStepNumber();

        if (currentStep > 1) {
            this.goToStep(currentStep - 1);
        }
    },

    /**
     * Validate current step
     */
    validateCurrentStep() {
        const step = this.getCurrentStepNumber();
        const formData = this.collectCurrentStepData();

        switch (step) {
            case 1: // Property Type
                if (!formData.listingType || !formData.propertyType) {
                    alert('⚠️ कृपया संपत्ति का प्रकार चुनें\nPlease select property type');
                    return false;
                }
                return true;

            case 2: // Location
                if (!formData.city || !formData.area) {
                    alert('⚠️ कृपया स्थान भरें\nPlease fill location details');
                    return false;
                }
                return true;

            case 3: // Details
                if (!formData.bedrooms || !formData.sqft) {
                    alert('⚠️ कृपया बेडरूम और क्षेत्रफल भरें\nPlease fill bedrooms and area');
                    return false;
                }
                return true;

            case 4: // Price & Photos
                if (!formData.price) {
                    alert('⚠️ कृपया कीमत भरें\nPlease enter price');
                    return false;
                }
                return true;

            case 5: // Contact
                if (!formData.name || !formData.phone) {
                    alert('⚠️ कृपया नाम और मोबाइल नंबर भरें\nPlease fill name and phone');
                    return false;
                }
                if (formData.phone && formData.phone.length !== 10) {
                    alert('⚠️ कृपया सही मोबाइल नंबर भरें (10 अंक)\nPlease enter valid phone (10 digits)');
                    return false;
                }
                return true;

            default:
                return true;
        }
    },

    /**
     * Update progress bar
     */
    updateProgress(stepNumber) {
        const percentage = Math.round((stepNumber / this.TOTAL_STEPS) * 100);

        // Update progress bar fill
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        // Update progress text
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = `Step ${stepNumber} of ${this.TOTAL_STEPS} (${percentage}%)`;
        }

        // Update step indicators
        for (let i = 1; i <= this.TOTAL_STEPS; i++) {
            const stepEl = document.querySelector(`.progress-step[data-step="${i}"]`);
            if (stepEl) {
                if (i < stepNumber) {
                    stepEl.classList.add('completed');
                    stepEl.classList.remove('active');
                } else if (i === stepNumber) {
                    stepEl.classList.add('active');
                    stepEl.classList.remove('completed');
                } else {
                    stepEl.classList.remove('active', 'completed');
                }
            }
        }
    },

    /**
     * Submit property listing
     * PRIMARY: Saves to Firebase Firestore (permanent, visible to all users)
     * FALLBACK: Saves to localStorage if Firebase unavailable
     */
    async submitProperty() {
        const draft = this.getDraft();

        // Get logged-in user
        const user = window.AppState ? window.AppState.getUser() : null;

        // Combine all steps
        const propertyData = {
            ...draft.step1,
            ...draft.step2,
            ...draft.step3,
            ...draft.step4,
            ...draft.step5,
            submittedAt: new Date().toISOString()
        };

        console.log('📤 Preparing property for Firestore:', propertyData);

        try {
            // ── Strip base64 data: URLs (too large for Firestore) ──
            const PLACEHOLDER_IMAGES = [
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800'
            ];

            const rawPhotos = (this._pendingPhotos && this._pendingPhotos.length > 0)
                ? this._pendingPhotos
                : (propertyData.photos && propertyData.photos.length > 0 ? propertyData.photos : []);

            const sanitisedImages = rawPhotos.length > 0
                ? rawPhotos.map((p, i) =>
                    typeof p === 'string' && p.startsWith('data:')
                        ? PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]
                        : p
                  )
                : PLACEHOLDER_IMAGES.slice(0, 2);

            const pendingReels = this._pendingReels || propertyData.reels || [];
            const sanitisedReels = pendingReels
                .filter(r => r && typeof (r.dataUrl || r) === 'string' && !(r.dataUrl || r).startsWith('data:'))
                .map(r => r.dataUrl || r);

            const newProperty = {
                title: propertyData.title || `${propertyData.bedrooms || ''} BHK ${propertyData.propertyType || 'Property'} in ${propertyData.area || ''}`.trim(),
                price: parseFloat(propertyData.price) || 0,
                bhk: propertyData.bedrooms ? `${propertyData.bedrooms} BHK` : '1 BHK',
                sqft: parseFloat(propertyData.sqft) || 0,
                bathrooms: parseInt(propertyData.bathrooms) || 1,
                address: propertyData.address || `${propertyData.area || ''}, ${propertyData.city || ''}`,
                city: propertyData.city || 'Lucknow',
                area: propertyData.area || '',
                latitude: parseFloat(propertyData.latitude) || 26.8467,
                longitude: parseFloat(propertyData.longitude) || 80.9462,
                ownerId: user ? (user.uid || user.id) : 'anonymous',
                ownerName: propertyData.name || (user ? user.name : 'Seller'),
                contactNumber: propertyData.phone || propertyData.contactNumber || '',
                whatsappEnabled: true,
                verificationStatus: 'under_review',
                propertyType: propertyData.propertyType || 'flat',
                listingType: propertyData.listingType || 'sell',
                furnishing: propertyData.furnished || propertyData.furnishing || 'unfurnished',
                parking: propertyData.parking || 'no',
                images: sanitisedImages,
                reels: sanitisedReels,
                amenities: ['Parking', 'Security'],
                yearBuilt: new Date().getFullYear(),
                featured: false,
                status: 'published'
            };

            // ── PRIMARY: Save to Firestore ──────────────────────────────────────
            if (window.FirebaseService) {
                try {
                    const firestoreId = await FirebaseService.addProperty(newProperty);
                    newProperty.id = firestoreId;
                    console.log('✅ Property saved to Firestore! ID:', firestoreId);

                    // Clear draft after successful Firestore save
                    this.clearDraft();

                    // Show success toast
                    this._showSuccessToast('🎉 Property published! It\'s now live for everyone to see.');

                    setTimeout(() => { window.location.href = 'home.html'; }, 1800);
                    return;
                } catch (firestoreErr) {
                    console.warn('⚠️ Firestore save failed, falling back to localStorage:', firestoreErr);
                    // Fall through to localStorage fallback
                }
            }

            // ── FALLBACK: localStorage ──────────────────────────────────────────
            console.warn('⚠️ Using localStorage fallback (Firebase not available)');
            newProperty.id = 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            newProperty.createdAt = new Date().toISOString();

            this.clearDraft();
            let existingList = [];
            try {
                const existingRaw = localStorage.getItem('submittedProperties');
                existingList = existingRaw ? JSON.parse(existingRaw) : [];
            } catch (e) { existingList = []; }
            existingList.push(newProperty);
            localStorage.setItem('submittedProperties', JSON.stringify(existingList));

            if (window.PropertiesData) {
                if (typeof window.PropertiesData.clearCache === 'function') window.PropertiesData.clearCache();
                if (Array.isArray(window.PropertiesData.properties)) window.PropertiesData.properties.unshift(newProperty);
            }

            alert('🎉 बधाई हो! आपकी संपत्ति सूचीबद्ध हो गई है!\n\nCongratulations! Your property has been listed!');
            setTimeout(() => { window.location.href = 'home.html'; }, 1500);

        } catch (error) {
            console.error('❌ Publish failed:', error);
            alert('⚠️ Something went wrong. Please try again.\n\nError: ' + error.message);

            const publishBtn = document.getElementById('publishBtn');
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = '🎉 Publish My Property / मेरी संपत्ति प्रकाशित करें';
            }
        }
    },

    /**
     * Show a beautiful success toast (non-blocking, no alert popup)
     */
    _showSuccessToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white; padding: 1.2rem 2rem; border-radius: 16px;
            font-size: 1.05rem; font-weight: 700; z-index: 99999;
            box-shadow: 0 8px 30px rgba(34,197,94,0.4);
            animation: slideUp 0.4s ease; max-width: 90vw; text-align: center;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    /**
     * Format price in Indian format
     */
    formatIndianPrice(price) {
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} Lakh`;
        } else {
            return `₹${price.toLocaleString('en-IN')}`;
        }
    }
};

// Initialize on page load
if (typeof window !== 'undefined') {
    window.FormUtils = FormUtils;

    document.addEventListener('DOMContentLoaded', function () {
        FormUtils.init();

        // Update progress for current step
        const currentStep = FormUtils.getCurrentStepNumber();
        FormUtils.updateProgress(currentStep);

        // Load saved data into form
        const draft = FormUtils.getDraft();
        const stepData = draft[`step${currentStep}`];

        if (stepData && Object.keys(stepData).length > 0) {
            console.log(`📥 Loading saved data for step ${currentStep}:`, stepData);

            // Fill form with saved data
            Object.keys(stepData).forEach(key => {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'radio' || input.type === 'checkbox') {
                        const matchingInput = document.querySelector(`[name="${key}"][value="${stepData[key]}"]`);
                        if (matchingInput) {
                            matchingInput.checked = true;
                        }
                    } else {
                        input.value = stepData[key];
                    }
                }
            });
        }
    });
}
