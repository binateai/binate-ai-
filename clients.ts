/**
 * Client management routes
 * These routes allow retrieving and managing client data
 */
import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

/**
 * Get all clients for the authenticated user
 * GET /api/clients
 */
router.get('/', async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const userId = req.session.userId;
    
    // Get all clients for the user
    const clients = await storage.getClientsByUserId(userId);
    
    // Get all Slack integrations to determine which clients have integrations
    const slackIntegrations = await storage.getSlackIntegrationsByUserId(userId);
    
    // Map clients with slack integration status
    const clientsWithIntegrations = clients.map(client => {
      const hasIntegration = slackIntegrations.some(
        integration => integration.clientId === client.id
      );
      
      return {
        id: client.id,
        name: client.name || `Client ${client.id}`,
        hasSlackIntegration: hasIntegration
      };
    });
    
    return res.json(clientsWithIntegrations);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

/**
 * Get a specific client by ID
 * GET /api/clients/:id
 */
router.get('/:id', async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const userId = req.session.userId;
    const clientId = parseInt(req.params.id);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ success: false, error: 'Invalid client ID' });
    }
    
    // Get the client
    const client = await storage.getClientById(clientId);
    
    // Check if client exists and belongs to the user
    if (!client || client.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    
    // Get Slack integration for this client
    const slackIntegration = await storage.getSlackIntegrationByClientId(clientId);
    
    return res.json({
      id: client.id,
      name: client.name || `Client ${client.id}`,
      hasSlackIntegration: !!slackIntegration
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch client' });
  }
});

export default router;