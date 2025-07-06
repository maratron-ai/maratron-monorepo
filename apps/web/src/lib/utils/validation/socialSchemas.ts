/**
 * Social platform validation schemas
 * Provides input validation for social features to prevent SQL injection and XSS
 */

import * as yup from 'yup';

/**
 * Social search query validation schema
 */
export const socialSearchSchema = yup.object({
  q: yup
    .string()
    .trim()
    .max(100, 'Search query too long (max 100 characters)')
    .matches(
      /^[a-zA-Z0-9\s\-_.@]+$/, 
      'Search query contains invalid characters'
    )
    .required('Search query is required'),
  profileId: yup
    .string()
    .trim()
    .uuid('Invalid profile ID format')
    .optional()
});

/**
 * Social post creation validation schema
 */
export const socialPostSchema = yup.object({
  socialProfileId: yup
    .string()
    .trim()
    .uuid('Invalid social profile ID')
    .required('Social profile ID is required'),
  content: yup
    .string()
    .trim()
    .max(2000, 'Post content too long (max 2000 characters)')
    .min(1, 'Post content cannot be empty')
    .matches(
      /^[^<>{}]*$/, 
      'Post content contains invalid characters'
    )
    .required('Post content is required'),
  title: yup
    .string()
    .trim()
    .max(200, 'Post title too long (max 200 characters)')
    .optional(),
  runId: yup
    .string()
    .trim()
    .uuid('Invalid run ID format')
    .optional(),
  photos: yup
    .array()
    .of(yup.string().url('Invalid photo URL'))
    .max(5, 'Too many photos (max 5)')
    .optional(),
  visibility: yup
    .string()
    .oneOf(['PUBLIC', 'FRIENDS', 'PRIVATE'], 'Invalid visibility setting')
    .default('PUBLIC')
    .optional(),
  tags: yup
    .array()
    .of(
      yup.string()
        .trim()
        .max(50, 'Tag too long (max 50 characters)')
        .matches(/^[a-zA-Z0-9_-]+$/, 'Invalid tag format')
    )
    .max(10, 'Too many tags (max 10)')
    .optional()
});

/**
 * Social comment validation schema
 */
export const socialCommentSchema = yup.object({
  postId: yup
    .string()
    .trim()
    .uuid('Invalid post ID')
    .required('Post ID is required'),
  content: yup
    .string()
    .trim()
    .max(500, 'Comment too long (max 500 characters)')
    .min(1, 'Comment cannot be empty')
    .matches(
      /^[^<>{}]*$/, 
      'Comment contains invalid characters'
    )
    .required('Comment content is required'),
  parentCommentId: yup
    .string()
    .trim()
    .uuid('Invalid parent comment ID')
    .optional()
});

/**
 * Newsletter subscription validation schema
 */
export const newsletterSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Invalid email format')
    .max(254, 'Email address too long')
    .required('Email is required'),
  preferences: yup
    .object({
      frequency: yup
        .string()
        .oneOf(['weekly', 'monthly'], 'Invalid frequency')
        .default('weekly'),
      topics: yup
        .array()
        .of(yup.string().oneOf(['training', 'nutrition', 'gear', 'races']))
        .max(5, 'Too many topic preferences')
        .default([])
    })
    .optional()
});

/**
 * User profile update validation schema
 */
export const profileUpdateSchema = yup.object({
  username: yup
    .string()
    .trim()
    .min(3, 'Username too short (min 3 characters)')
    .max(30, 'Username too long (max 30 characters)')
    .matches(
      /^[a-zA-Z0-9_-]+$/, 
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  bio: yup
    .string()
    .trim()
    .max(500, 'Bio too long (max 500 characters)')
    .matches(
      /^[^<>{}]*$/, 
      'Bio contains invalid characters'
    )
    .optional(),
  displayName: yup
    .string()
    .trim()
    .max(100, 'Display name too long (max 100 characters)')
    .matches(
      /^[^<>{}]*$/, 
      'Display name contains invalid characters'
    )
    .optional(),
  website: yup
    .string()
    .trim()
    .url('Invalid website URL')
    .max(200, 'Website URL too long')
    .optional(),
  location: yup
    .string()
    .trim()
    .max(100, 'Location too long (max 100 characters)')
    .matches(
      /^[^<>{}]*$/, 
      'Location contains invalid characters'
    )
    .optional()
});

/**
 * Sanitize search tokens to prevent injection attacks
 */
export function sanitizeSearchTokens(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(token => token.replace(/[^\w\s\-_.@]/g, '')) // Remove non-alphanumeric except safe chars
    .map(token => token.replace(/['";-]/g, '')) // Remove SQL injection characters
    .filter(token => token.length > 0 && token.length <= 50)
    .slice(0, 10); // Limit to 10 tokens max
}

/**
 * Validate and sanitize post content for database insertion
 */
export function validatePostContent(content: string): { isValid: boolean; sanitized?: string; error?: string } {
  try {
    // Length check
    if (content.length > 2000) {
      return { isValid: false, error: 'Content too long (max 2000 characters)' };
    }

    if (content.trim().length === 0) {
      return { isValid: false, error: 'Content cannot be empty' };
    }

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /['"];.*?(?:drop|delete|insert|update|select|union|exec|execute)/gi,
      /['"].*?(?:or|and).*?['"].*?[=<>]/gi,
      /;.*?(?:drop|delete|insert|update)/gi,
      /--.*$/gm,
      /\/\*.*?\*\//g
    ];

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    // Check for NoSQL injection patterns
    const nosqlPatterns = [
      /\{.*?\$.*?\}/g,
      /\{.*?(?:\$where|\$gt|\$lt|\$ne|\$in|\$nin|\$exists|\$regex).*?\}/gi
    ];

    // Check for dangerous characters that could be used for injection
    const dangerousChars = /[{}<>]/g;

    const allPatterns = [...sqlInjectionPatterns, ...xssPatterns, ...nosqlPatterns];
    const hasSuspiciousContent = allPatterns.some(pattern => pattern.test(content)) || dangerousChars.test(content);
    
    if (hasSuspiciousContent) {
      return { isValid: false, error: 'Content contains invalid characters or patterns' };
    }

    // Basic sanitization - remove potential HTML/script content
    const sanitized = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/vbscript:/gi, '') // Remove VBScript
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[{}<>]/g, '') // Remove dangerous characters
      .trim();

    return { isValid: true, sanitized };

  } catch (error) {
    return { isValid: false, error: 'Content validation failed' };
  }
}