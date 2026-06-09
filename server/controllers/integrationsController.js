const getLinkedAccounts = async (req, res, next) => {
  try {
    // TODO: implement
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

const reconnectPlatform = async (req, res, next) => {
  try {
    // TODO: implement
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

const getSecurityLogs = async (req, res, next) => {
  try {
    // TODO: implement
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLinkedAccounts,
  reconnectPlatform,
  getSecurityLogs
};
