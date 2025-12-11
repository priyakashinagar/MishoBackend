/**
 * @fileoverview Swagger API documentation configuration
 * @module docs/swagger
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meesho Backend API',
      version: '1.0.0',
      description: `
        Advanced Node.js + Express + MongoDB backend API for Meesho clone.
        
        ## Features
        - JWT Authentication & Authorization
        - Three User Roles: User, Seller, Admin
        - Product Management
        - Order Management
        - Seller KYC Verification
        - Payment Integration
        - File Upload (Cloudinary)
        - Email Notifications
        
        ## Authentication
        Most endpoints require authentication. Include the JWT token in the Authorization header:
        \`Authorization: Bearer <token>\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@meesho.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'https://mishobackend.onrender.com',
        description: 'Production server (Deployed) - Use this for testing'
      },
      {
        url: 'http://localhost:5000',
        description: 'Local development server'
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Sellers',
        description: 'Seller management endpoints'
      },
      {
        name: 'Admin',
        description: 'Admin panel endpoints'
      },
      {
        name: 'Products',
        description: 'Product management endpoints'
      },
      {
        name: 'Orders',
        description: 'Order management endpoints'
      },
      {
        name: 'Categories',
        description: 'Category management endpoints'
      },
      {
        name: 'Cart',
        description: 'Shopping cart endpoints'
      },
      {
        name: 'Wishlist',
        description: 'Wishlist management endpoints'
      },
      {
        name: 'Ratings',
        description: 'Product ratings and reviews endpoints'
      },
      {
        name: 'Earnings',
        description: 'Seller earnings endpoints'
      },
      {
        name: 'Catalog',
        description: 'Catalog upload endpoints (Bulk & Single)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            role: {
              type: 'string',
              enum: ['user', 'seller', 'admin'],
              description: 'User role'
            },
            avatar: {
              type: 'object',
              properties: {
                public_id: { type: 'string' },
                url: { type: 'string' }
              }
            },
            isEmailVerified: {
              type: 'boolean'
            },
            isPhoneVerified: {
              type: 'boolean'
            },
            addresses: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Address'
              }
            },
            wishlist: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Address: {
          type: 'object',
          required: ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'],
          properties: {
            fullName: { type: 'string' },
            phone: { type: 'string' },
            addressLine1: { type: 'string' },
            addressLine2: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            pincode: { type: 'string' },
            landmark: { type: 'string' },
            addressType: {
              type: 'string',
              enum: ['home', 'work', 'other']
            },
            isDefault: { type: 'boolean' }
          }
        },
        Seller: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string', description: 'User ID reference' },
            shopName: { type: 'string' },
            shopLogo: {
              type: 'object',
              properties: {
                public_id: { type: 'string' },
                url: { type: 'string' }
              }
            },
            businessType: {
              type: 'string',
              enum: ['individual', 'partnership', 'proprietorship', 'private_limited', 'public_limited']
            },
            description: { type: 'string' },
            businessAddress: {
              $ref: '#/components/schemas/Address'
            },
            kycStatus: {
              type: 'string',
              enum: ['pending', 'submitted', 'under_review', 'approved', 'rejected']
            },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
            stats: {
              type: 'object',
              properties: {
                totalProducts: { type: 'number' },
                totalOrders: { type: 'number' },
                totalRevenue: { type: 'number' },
                totalEarnings: { type: 'number' }
              }
            },
            ratings: {
              type: 'object',
              properties: {
                average: { type: 'number', minimum: 0, maximum: 5 },
                count: { type: 'number' }
              }
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            seller: { 
              type: 'string',
              description: 'Seller or Admin User ID reference'
            },
            sellerModel: {
              type: 'string',
              enum: ['Seller', 'User'],
              description: 'Model type for seller reference (Seller for sellers, User for admins)'
            },
            category: { type: 'string' },
            price: { type: 'number' },
            mrp: { type: 'number' },
            discount: { type: 'number' },
            sku: {
              type: 'string',
              description: 'Stock Keeping Unit'
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  public_id: { type: 'string' },
                  url: { type: 'string' }
                }
              }
            },
            stock: {
              type: 'object',
              properties: {
                quantity: { type: 'number' },
                status: {
                  type: 'string',
                  enum: ['in_stock', 'out_of_stock', 'low_stock', 'In Stock', 'Out of Stock']
                }
              }
            },
            minimumStock: {
              type: 'number',
              description: 'Minimum stock level for alerts'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Product tags for search and filtering'
            },
            shipping: {
              type: 'object',
              properties: {
                isFreeShipping: { type: 'boolean' },
                shippingCharge: { type: 'number' },
                deliveryTime: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' }
                  }
                }
              }
            },
            ratings: {
              type: 'object',
              properties: {
                average: { type: 'number' },
                count: { type: 'number' }
              }
            },
            isActive: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            views: { type: 'number' },
            soldCount: { type: 'number' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Category ID'
            },
            name: {
              type: 'string',
              description: 'Category name'
            },
            slug: {
              type: 'string',
              description: 'URL-friendly slug'
            },
            description: {
              type: 'string',
              description: 'Category description'
            },
            image: {
              type: 'string',
              description: 'Category image URL'
            },
            icon: {
              type: 'string',
              description: 'Category icon class or name'
            },
            parent: {
              type: 'string',
              description: 'Parent category ID for subcategories'
            },
            subcategories: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of subcategory IDs'
            },
            level: {
              type: 'number',
              description: 'Hierarchy level (0 for parent, 1 for sub, etc.)'
            },
            isActive: {
              type: 'boolean',
              description: 'Category active status'
            },
            order: {
              type: 'number',
              description: 'Display order'
            },
            productCount: {
              type: 'number',
              description: 'Number of products in category'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderId: { type: 'string' },
            user: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'number' },
                  seller: { type: 'string' }
                }
              }
            },
            shippingAddress: {
              $ref: '#/components/schemas/Address'
            },
            payment: {
              type: 'object',
              properties: {
                method: {
                  type: 'string',
                  enum: ['cod', 'online', 'wallet']
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'completed', 'failed', 'refunded']
                },
                transactionId: { type: 'string' }
              }
            },
            pricing: {
              type: 'object',
              properties: {
                itemsTotal: { type: 'number' },
                shippingCharge: { type: 'number' },
                tax: { type: 'number' },
                discount: { type: 'number' },
                total: { type: 'number' }
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded']
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            parent: { type: 'string' },
            image: {
              type: 'object',
              properties: {
                public_id: { type: 'string' },
                url: { type: 'string' }
              }
            },
            isActive: { type: 'boolean' },
            order: { type: 'number' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Success message'
            },
            data: {
              type: 'object'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { $ref: '#/components/schemas/Product' },
                  quantity: { type: 'number' },
                  price: { type: 'number' },
                  addedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            totalItems: { type: 'number' },
            totalPrice: { type: 'number' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CartItem: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', description: 'Product ID' },
            quantity: { type: 'number', default: 1 }
          }
        },
        Wishlist: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            products: {
              type: 'array',
              items: { $ref: '#/components/schemas/Product' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Rating: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            product: { type: 'string' },
            rating: { type: 'number', minimum: 1, maximum: 5 },
            title: { type: 'string' },
            review: { type: 'string' },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  public_id: { type: 'string' },
                  url: { type: 'string' }
                }
              }
            },
            isVerifiedPurchase: { type: 'boolean' },
            helpfulCount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        RatingInput: {
          type: 'object',
          required: ['productId', 'rating'],
          properties: {
            productId: { type: 'string', description: 'Product ID' },
            rating: { type: 'number', minimum: 1, maximum: 5, description: 'Rating (1-5)' },
            title: { type: 'string', description: 'Review title' },
            review: { type: 'string', description: 'Review text' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
