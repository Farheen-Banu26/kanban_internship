import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TaskFlow Collaborative Kanban API',
    version: '1.0.0',
    description: 'OpenAPI documentation for the existing TaskFlow backend APIs.',
    contact: {
      name: 'TaskFlow API Support',
      email: 'support@taskflow.local',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
 servers: [
  {
    url:
      process.env.NODE_ENV === 'production'
        ? 'https://kanban-internship-8vjw.onrender.com'
        : 'http://localhost:5000',
    description:
      process.env.NODE_ENV === 'production'
        ? 'Production Server'
        : 'Local Development Server',
  },
],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '64d9c78eb5b45a0a1b9cfa88' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-07-20T13:45:00.000Z' },
          workspaceCount: { type: 'integer', example: 3 },
          assignedTaskCount: { type: 'integer', example: 12 },
        },
      },
      Workspace: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '64d9c78eb5b45a0a1b9cfa99' },
          name: { type: 'string', example: 'Marketing Board' },
          purpose: { type: 'string', example: 'Track marketing campaigns' },
          inviteCode: { type: 'string', example: 'ABCD1234' },
          owner: { $ref: '#/components/schemas/User' },
          members: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          memberRoles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                role: { type: 'string', example: 'member' },
              },
            },
          },
          currentUserRole: { type: 'string', example: 'owner' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-07-20T13:45:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-07-21T08:21:07.000Z' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '64d9c78eb5b45a0a1b9cfb0' },
          title: { type: 'string', example: 'Design landing page' },
          description: { type: 'string', example: 'Create a new design for the marketing landing page.' },
          status: { type: 'string', example: 'in_progress', enum: ['todo', 'in_progress', 'review', 'done'] },
          priority: { type: 'string', example: 'medium', enum: ['low', 'medium', 'high', 'urgent'] },
          dueDate: { type: 'string', format: 'date-time', example: '2026-08-05T00:00:00.000Z' },
          labels: { type: 'array', items: { type: 'string' }, example: ['design', 'frontend'] },
          assignee: { $ref: '#/components/schemas/User' },
          workspace: { $ref: '#/components/schemas/Workspace' },
          createdBy: { $ref: '#/components/schemas/User' },
          attachments: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
          comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
          createdAt: { type: 'string', format: 'date-time', example: '2026-07-20T13:45:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-07-21T08:21:07.000Z' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '64d9c78eb5b45a0a1b9cfb7' },
          text: { type: 'string', example: 'Please review the designs and leave feedback.' },
          author: { $ref: '#/components/schemas/User' },
          mentions: { type: 'array', items: { type: 'string' }, example: ['john.doe@example.com'] },
          edited: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time', example: '2026-07-20T13:45:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-07-20T14:00:00.000Z' },
        },
      },
      Attachment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '64d9c78eb5b45a0a1b9cfc3' },
          fileName: { type: 'string', example: 'wireframe.png' },
          originalName: { type: 'string', example: 'wireframe.png' },
          fileType: { type: 'string', example: 'image/png' },
          fileSize: { type: 'integer', example: 32456 },
          fileUrl: { type: 'string', example: '/uploads/wireframe.png' },
          uploadedBy: { $ref: '#/components/schemas/User' },
          uploadedAt: { type: 'string', format: 'date-time', example: '2026-07-20T15:30:00.000Z' },
        },
      },
      Dashboard: {
        type: 'object',
        properties: {
          totalTasks: { type: 'integer', example: 42 },
          tasksByStatus: {
            type: 'object',
            properties: {
              todo: { type: 'integer', example: 12 },
              in_progress: { type: 'integer', example: 15 },
              review: { type: 'integer', example: 8 },
              done: { type: 'integer', example: 7 },
            },
          },
          priorityDistribution: {
            type: 'object',
            properties: {
              low: { type: 'integer', example: 5 },
              medium: { type: 'integer', example: 20 },
              high: { type: 'integer', example: 12 },
              urgent: { type: 'integer', example: 5 },
            },
          },
          overdueTasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
          myTasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      JWTResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOi...' },
              user: { $ref: '#/components/schemas/User' },
            },
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
        },
      },
      WorkspaceCreateRequest: {
        type: 'object',
        required: ['name', 'purpose'],
        properties: {
          name: { type: 'string', example: 'Marketing Board' },
          purpose: { type: 'string', example: 'Track marketing campaigns' },
        },
      },
      WorkspaceJoinRequest: {
        type: 'object',
        required: ['inviteCode'],
        properties: {
          inviteCode: { type: 'string', example: 'ABCD1234' },
        },
      },
      WorkspaceInviteRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'invitee@example.com' },
        },
      },
      TaskCreateRequest: {
        type: 'object',
        required: ['title', 'workspace'],
        properties: {
          title: { type: 'string', example: 'Design landing page' },
          description: { type: 'string', example: 'Create a new design for the homepage.' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], example: 'todo' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'medium' },
          dueDate: { type: 'string', format: 'date-time', example: '2026-08-05T00:00:00.000Z' },
          labels: { type: 'array', items: { type: 'string' }, example: ['design', 'frontend'] },
          assignee: { type: 'string', example: '64d9c78eb5b45a0a1b9cfa88' },
          workspace: { type: 'string', example: '64d9c78eb5b45a0a1b9cfa99' },
        },
      },
      TaskUpdateRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Design landing page' },
          description: { type: 'string', example: 'Update homepage layout.' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], example: 'in_progress' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'high' },
          dueDate: { type: 'string', format: 'date-time', example: '2026-08-10T00:00:00.000Z' },
          labels: { type: 'array', items: { type: 'string' }, example: ['ui', 'backend'] },
          assignee: { type: 'string', example: '64d9c78eb5b45a0a1b9cfa88' },
        },
      },
      CommentRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', example: 'Please review this update.' },
          mentions: { type: 'array', items: { type: 'string' }, example: ['john@example.com'] },
        },
      },
      UserUpdateRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          password: { type: 'string', example: 'newPassword123' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Not authorized, invalid token' },
          },
        },
      },
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Validation error' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Resource not found' },
          },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'API health check',
        responses: {
          '200': {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
                example: { success: true, message: 'Kanban API is running' },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/JWTResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/JWTResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/workspaces': {
      get: {
        tags: ['Workspace'],
        summary: 'List workspaces for the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of workspaces',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Workspace' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Workspace'],
        summary: 'Create a new workspace',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WorkspaceCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Workspace created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Workspace' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/workspaces/join': {
      post: {
        tags: ['Workspace'],
        summary: 'Join a workspace using an invite code',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WorkspaceJoinRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Joined workspace successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Workspace' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/workspaces/{id}': {
      put: {
        tags: ['Workspace'],
        summary: 'Update workspace details',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Workspace ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Marketing Board' },
                  purpose: { type: 'string', example: 'Track marketing campaigns' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Workspace updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Workspace' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Workspace'],
        summary: 'Delete a workspace',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Workspace ID',
          },
        ],
        responses: {
          '200': {
            description: 'Workspace deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/workspaces/{id}/roles': {
      put: {
        tags: ['Workspace'],
        summary: 'Update a workspace member role',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Workspace ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'role'],
                properties: {
                  userId: { type: 'string', example: '64d9c78eb5b45a0a1b9cfa88' },
                  role: { type: 'string', example: 'member' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Member role updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Workspace' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/workspaces/{id}/invite-email': {
      post: {
        tags: ['Workspace'],
        summary: 'Invite a user to a workspace by email',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Workspace ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WorkspaceInviteRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Invitation sent successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        inviteCode: { type: 'string' },
                        expiresAt: { type: 'string', format: 'date-time' },
                        emailSent: { type: 'boolean' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/workspaces/{id}/activity': {
      get: {
        tags: ['Workspace'],
        summary: 'Get recent workspace activity',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Workspace ID',
          },
        ],
        responses: {
          '200': {
            description: 'Workspace activity returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks in a workspace',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'workspaceId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Workspace ID',
          },
        ],
        responses: {
          '200': {
            description: 'Task list returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskCreateRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/tasks/{id}': {
      put: {
        tags: ['Tasks'],
        summary: 'Update an existing task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskUpdateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Task deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/tasks/{id}/comments': {
      get: {
        tags: ['Comments'],
        summary: 'List comments for a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Task comments returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Add a comment to a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CommentRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Comment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Comment' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/tasks/{id}/comments/{commentId}': {
      put: {
        tags: ['Comments'],
        summary: 'Update a task comment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'commentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CommentRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Comment updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Comment' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Comments'],
        summary: 'Delete a task comment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'commentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Comment deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/tasks/{id}/attachments': {
      post: {
        tags: ['Attachments'],
        summary: 'Upload an attachment for a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  attachment: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Attachment uploaded successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      get: {
        tags: ['Attachments'],
        summary: 'Get attachments for a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Task attachments returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/tasks/{id}/attachments/{attachmentId}': {
      delete: {
        tags: ['Attachments'],
        summary: 'Delete an attachment from a task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Attachment deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard data for a workspace',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'workspaceId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'Workspace ID',
          },
        ],
        responses: {
          '200': {
            description: 'Dashboard data returned',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Dashboard' } } } },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/users/profile': {
      get: {
        tags: ['User'],
        summary: 'Get current authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Profile returned',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/User' } } } },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['User'],
        summary: 'Update authenticated user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdateRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/User' } } } },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get authenticated user notifications',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Notifications returned',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { type: 'object' } }, unreadCount: { type: 'integer' } } } },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Notifications'],
        summary: 'Clear all authenticated user notifications',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Notifications cleared successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Notifications marked as read',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/invitations/{token}': {
      get: {
        tags: ['Invitations'],
        summary: 'Get details for an invitation token',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Invitation details returned',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/invitations/{token}/accept': {
      post: {
        tags: ['Invitations'],
        summary: 'Accept an invitation using a token',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Invitation accepted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { type: 'object' } } },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
export default swaggerSpec;
