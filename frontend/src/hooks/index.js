import { useEffect, useCallback, useState } from 'react';
import { useApp } from '../contexts/AppContext';

// Keyboard shortcuts hook
export const useKeyboard = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.altKey ? 'alt+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key.toLowerCase()}`;
      
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Data fetching hook with firm context
export const useData = (endpoint, dependencies = []) => {
  const { state, actions } = useApp();
  
  const fetchData = useCallback(async () => {
    if (!state.selectedFirm) return;
    
    actions.setLoading(true);
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/${endpoint}?firmId=${state.selectedFirm.id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      actions.showToast('Failed to fetch data', 'error');
      return null;
    } finally {
      actions.setLoading(false);
    }
  }, [endpoint, state.selectedFirm, actions, ...dependencies]);

  return { fetchData, loading: state.loading };
};

// Form validation hook
export const useForm = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((fieldName, value) => {
    if (!validationRules[fieldName]) return '';
    
    for (const rule of validationRules[fieldName]) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  }, [validationRules, values]);

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, values[name]) }));
  };

  const isValid = Object.keys(validationRules).every(field => !validate(field, values[field]));

  return { values, errors, touched, handleChange, handleBlur, isValid };
};