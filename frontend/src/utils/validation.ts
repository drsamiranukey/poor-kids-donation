// Validation utilities for forms and data

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationUtils {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Phone validation
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone) {
      errors.push('Phone number is required');
    } else {
      // Remove all non-digit characters
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (cleanPhone.length < 10) {
        errors.push('Phone number must be at least 10 digits');
      } else if (cleanPhone.length > 15) {
        errors.push('Phone number cannot exceed 15 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Name validation
  static validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    const errors: string[] = [];
    
    if (!name) {
      errors.push(`${fieldName} is required`);
    } else {
      if (name.length < 2) {
        errors.push(`${fieldName} must be at least 2 characters long`);
      }
      if (name.length > 50) {
        errors.push(`${fieldName} cannot exceed 50 characters`);
      }
      if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Amount validation
  static validateAmount(amount: number | string, minAmount: number = 1): ValidationResult {
    const errors: string[] = [];
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (!amount && amount !== 0) {
      errors.push('Amount is required');
    } else if (isNaN(numAmount)) {
      errors.push('Please enter a valid amount');
    } else {
      if (numAmount < minAmount) {
        errors.push(`Minimum donation amount is $${minAmount}`);
      }
      if (numAmount > 100000) {
        errors.push('Maximum donation amount is $100,000');
      }
      // Check for more than 2 decimal places
      if (numAmount.toString().includes('.') && numAmount.toString().split('.')[1].length > 2) {
        errors.push('Amount cannot have more than 2 decimal places');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Message validation
  static validateMessage(message: string, maxLength: number = 500): ValidationResult {
    const errors: string[] = [];
    
    if (message && message.length > maxLength) {
      errors.push(`Message cannot exceed ${maxLength} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Address validation
  static validateAddress(address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }): ValidationResult {
    const errors: string[] = [];
    
    if (address.street && address.street.length > 100) {
      errors.push('Street address cannot exceed 100 characters');
    }
    
    if (address.city && address.city.length > 50) {
      errors.push('City cannot exceed 50 characters');
    }
    
    if (address.state && address.state.length > 50) {
      errors.push('State cannot exceed 50 characters');
    }
    
    if (address.zipCode) {
      // US ZIP code validation (can be extended for other countries)
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(address.zipCode)) {
        errors.push('Please enter a valid ZIP code (e.g., 12345 or 12345-6789)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (password.length > 128) {
        errors.push('Password cannot exceed 128 characters');
      }
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Confirm password validation
  static validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
    const errors: string[] = [];
    
    if (!confirmPassword) {
      errors.push('Please confirm your password');
    } else if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // URL validation
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    if (url) {
      try {
        new URL(url);
      } catch {
        errors.push('Please enter a valid URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Date validation
  static validateDate(date: string | Date, minDate?: Date, maxDate?: Date): ValidationResult {
    const errors: string[] = [];
    
    if (!date) {
      errors.push('Date is required');
    } else {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        errors.push('Please enter a valid date');
      } else {
        if (minDate && dateObj < minDate) {
          errors.push(`Date cannot be before ${minDate.toLocaleDateString()}`);
        }
        if (maxDate && dateObj > maxDate) {
          errors.push(`Date cannot be after ${maxDate.toLocaleDateString()}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Credit card validation (basic Luhn algorithm)
  static validateCreditCard(cardNumber: string): ValidationResult {
    const errors: string[] = [];
    
    if (!cardNumber) {
      errors.push('Card number is required');
    } else {
      const cleanNumber = cardNumber.replace(/\s/g, '');
      
      if (!/^\d+$/.test(cleanNumber)) {
        errors.push('Card number can only contain digits');
      } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        errors.push('Card number must be between 13 and 19 digits');
      } else if (!this.luhnCheck(cleanNumber)) {
        errors.push('Please enter a valid card number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // CVV validation
  static validateCvv(cvv: string, cardType?: string): ValidationResult {
    const errors: string[] = [];
    
    if (!cvv) {
      errors.push('CVV is required');
    } else {
      const expectedLength = cardType === 'amex' ? 4 : 3;
      
      if (!/^\d+$/.test(cvv)) {
        errors.push('CVV can only contain digits');
      } else if (cvv.length !== expectedLength) {
        errors.push(`CVV must be ${expectedLength} digits`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Expiry date validation
  static validateExpiryDate(month: string, year: string): ValidationResult {
    const errors: string[] = [];
    
    if (!month || !year) {
      errors.push('Expiry date is required');
    } else {
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      if (monthNum < 1 || monthNum > 12) {
        errors.push('Please enter a valid month (01-12)');
      }
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
        errors.push('Card has expired');
      }
      
      if (yearNum > currentYear + 20) {
        errors.push('Expiry year seems too far in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Luhn algorithm for credit card validation
  private static luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  // Sanitization methods
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  static formatPhone(phone: string): string {
    const cleaned = this.sanitizePhone(phone);
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Comprehensive form validation
  static validateForm(data: any, rules: { [key: string]: (value: any) => ValidationResult }): {
    isValid: boolean;
    errors: { [key: string]: string[] };
  } {
    const errors: { [key: string]: string[] } = {};
    let isValid = true;

    for (const [field, validator] of Object.entries(rules)) {
      const result = validator(data[field]);
      if (!result.isValid) {
        errors[field] = result.errors;
        isValid = false;
      }
    }

    return { isValid, errors };
  }
}

export default ValidationUtils;