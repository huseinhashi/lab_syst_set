// src/utils/errorHandling.js

import { useState } from 'react';

export const useFormValidation = () => {
  const [validationErrors, setValidationErrors] = useState({});

  const setErrors = (errors) => {
    setValidationErrors(errors);
  };

  const clearErrors = () => {
    setValidationErrors({});
  };

  const clearFieldError = (fieldName) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const hasErrors = Object.keys(validationErrors).length > 0;

  return {
    validationErrors,
    setErrors,
    clearErrors,
    clearFieldError,
    hasErrors
  };
};

export const hasFieldError = (errors, fieldName) => {
  return errors && errors[fieldName];
};

export const parseBackendErrors = (error) => {
  const errors = {};
  
  if (error.response?.data?.errors) {
    // Handle validation errors from backend
    error.response.data.errors.forEach(err => {
      errors[err.field] = err.message;
    });
  } else if (error.response?.data?.message) {
    // Handle general error message
    errors.general = error.response.data.message;
  } else {
    // Handle network or other errors
    errors.general = error.message || 'An error occurred';
  }
  
  return errors;
};

export const handleRequestError = (error, setErrors, toast) => {
  const parsedErrors = parseBackendErrors(error);
  setErrors(parsedErrors);
  
  if (parsedErrors.general) {
    toast({
      variant: "destructive",
      title: "Error",
      description: parsedErrors.general,
    });
  }
};
