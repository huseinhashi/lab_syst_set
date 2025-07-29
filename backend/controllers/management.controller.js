import RelayState from "../models/relayState.model.js";
import PrayerTime from "../models/prayerTime.model.js";

// Get current relay states
export const getRelayStates = async (req, res, next) => {
  try {
    let relayState = await RelayState.findOne().sort({ lastUpdated: -1 });

    // If no relay state exists, create a default one
    if (!relayState) {
      relayState = await RelayState.create({
        relay1: false,
        relay2: false,
        relay3: false,
        relay4: false,
      });
    }

    res.status(200).json({
      success: true,
      data: relayState,
    });
  } catch (error) {
    next(error);
  }
};

// Update all relay states
export const updateRelayStates = async (req, res, next) => {
  try {
    const { relay1, relay2, relay3, relay4 } = req.body;

    // Validate input
    if (relay1 === undefined || relay2 === undefined || relay3 === undefined || relay4 === undefined) {
      return res.status(400).json({
        success: false,
        message: "All relay states are required",
      });
    }

    // Update or create relay state
    const relayState = await RelayState.findOneAndUpdate(
      {},
      {
        relay1,
        relay2,
        relay3,
        relay4,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Relay states updated successfully",
      data: relayState,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle specific relay
export const toggleRelay = async (req, res, next) => {
  try {
    const { relayId } = req.params;
    const relayNumber = parseInt(relayId);

    if (relayNumber < 1 || relayNumber > 4) {
      return res.status(400).json({
        success: false,
        message: "Relay ID must be between 1 and 4",
      });
    }

    let relayState = await RelayState.findOne().sort({ lastUpdated: -1 });

    // If no relay state exists, create a default one
    if (!relayState) {
      relayState = await RelayState.create({
        relay1: false,
        relay2: false,
        relay3: false,
        relay4: false,
      });
    }

    // Toggle the specific relay
    const relayKey = `relay${relayNumber}`;
    relayState[relayKey] = !relayState[relayKey];
    relayState.lastUpdated = new Date();
    await relayState.save();

    res.status(200).json({
      success: true,
      message: `Relay ${relayId} toggled successfully`,
      data: relayState,
    });
  } catch (error) {
    next(error);
  }
};

// Set all relays to ON or OFF
export const setAllRelays = async (req, res, next) => {
  try {
    // Determine state based on the route path
    const isOn = req.path.includes('all-on');

    // Update or create relay state
    const relayState = await RelayState.findOneAndUpdate(
      {},
      {
        relay1: isOn,
        relay2: isOn,
        relay3: isOn,
        relay4: isOn,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `All relays turned ${isOn ? 'ON' : 'OFF'} successfully`,
      data: relayState,
    });
  } catch (error) {
    next(error);
  }
};

// Prayer Times CRUD
export const getPrayerTimes = async (req, res, next) => {
  try {
    const prayerTimes = await PrayerTime.find().sort({ hour: 1, minute: 1 });

    res.status(200).json({
      success: true,
      data: prayerTimes,
    });
  } catch (error) {
    next(error);
  }
};

export const createPrayerTime = async (req, res, next) => {
  try {
    const { name, hour, minute, duration } = req.body;

    // Check if there are already 5 prayer times
    const prayerCount = await PrayerTime.countDocuments();
    if (prayerCount >= 5) {
      return res.status(400).json({
        success: false,
        message: "Cannot create more than 5 prayer times",
      });
    }

    // Validate input
    if (!name || hour === undefined || minute === undefined || duration === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, hour, minute, and duration are required",
      });
    }

    // Check if prayer time with same name already exists
    const existingPrayer = await PrayerTime.findOne({ name });
    if (existingPrayer) {
      return res.status(409).json({
        success: false,
        message: "Prayer time with this name already exists",
      });
    }

    const prayerTime = await PrayerTime.create({
      name,
      hour,
      minute,
      duration,
    });

    res.status(201).json({
      success: true,
      message: "Prayer time created successfully",
      data: prayerTime,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrayerTime = async (req, res, next) => {
  try {
    const prayerTime = await PrayerTime.findById(req.params.id);

    if (!prayerTime) {
      return res.status(404).json({
        success: false,
        message: "Prayer time not found",
      });
    }

    res.status(200).json({
      success: true,
      data: prayerTime,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePrayerTime = async (req, res, next) => {
  try {
    const { name, hour, minute, duration } = req.body;

    // Check if prayer time with same name already exists (excluding current one)
    if (name) {
      const existingPrayer = await PrayerTime.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      if (existingPrayer) {
        return res.status(409).json({
          success: false,
          message: "Prayer time with this name already exists",
        });
      }
    }

    const prayerTime = await PrayerTime.findByIdAndUpdate(
      req.params.id,
      { name, hour, minute, duration },
      { new: true }
    );

    if (!prayerTime) {
      return res.status(404).json({
        success: false,
        message: "Prayer time not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Prayer time updated successfully",
      data: prayerTime,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePrayerTime = async (req, res, next) => {
  try {
    const prayerTime = await PrayerTime.findByIdAndDelete(req.params.id);

    if (!prayerTime) {
      return res.status(404).json({
        success: false,
        message: "Prayer time not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Prayer time deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}; 