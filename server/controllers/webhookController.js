const receiveData = async (req, res, next) => {
  try {
    const payload = req.body;
    
    // Log the incoming data
    console.log(`[Webhook] Received data for user ${req.user.id}:`, payload);
    
    // Stub: Further logic to process or store the webhook payload could go here

    res.status(200).json({
      success: true,
      message: 'Webhook payload received successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { receiveData };
