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
     */
    async submitProperty() {
        const draft = this.getDraft();

        // Combine all steps
        const propertyData = {
            ...draft.step1,
            ...draft.step2,
            ...draft.step3,
            ...draft.step4,
            ...draft.step5,
            submittedAt: new Date().toISOString()
        };

        console.log('📤 Submitting property to API:', propertyData);

        try {
            // Send to backend API
            const response = await ApiConfig.post('/api/properties', propertyData);

            if (response.success) {
                console.log('✅ Property created:', response.property);

                // Clear frontend cache so new property appears
                if (window.PropertiesData && window.PropertiesData.clearCache) {
                    window.PropertiesData.clearCache();
                }

                // Clear draft
                this.clearDraft();

                // Also save to localStorage as backup
                const existingProperties = localStorage.getItem('submittedProperties');
                const properties = existingProperties ? JSON.parse(existingProperties) : [];
                properties.push({
                    id: response.propertyId,
                    ...propertyData,
                    status: 'published',
                    createdAt: new Date().toISOString()
                });
                localStorage.setItem('submittedProperties', JSON.stringify(properties));

                // Show success
                alert('🎉 बधाई हो! आपकी संपत्ति सफलतापूर्वक सूचीबद्ध हो गई है!\n\nCongratulations! Your property has been listed successfully!');

                // Redirect to home
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            } else {
                throw new Error(response.error || 'Failed to create property');
            }

        } catch (error) {
            console.error('❌ Submit failed:', error);
            alert('⚠️ कुछ गलत हुआ। कृपया फिर से प्रयास करें।\n\nSomething went wrong. Please try again.\n\nError: ' + error.message);

            // Re-enable publish button
            const publishBtn = document.getElementById('publishBtn');
            if (publishBtn) {
                publishBtn.disabled = false;
                publishBtn.textContent = '🎉 Publish My Property / मेरी संपत्ति प्रकाशित करें';
            }
        }
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
