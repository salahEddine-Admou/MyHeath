const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UserSubscription = require('../models/UserSubscription');

function monthsFromNow(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

function yearsFromNow(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + n);
  return d;
}

function endDateForPlan(plan, start = new Date()) {
  if (!plan) return null;
  if (plan.interval === 'lifetime') return null;
  if (plan.interval === 'yearly') return yearsFromNow(1);
  return monthsFromNow(1);
}

/** ---------- Overview ---------- */
exports.getOverview = async (_req, res) => {
  try {
    const [users, plans, subscriptions] = await Promise.all([
      User.find().select('role isActive hasDiabetes gender'),
      SubscriptionPlan.find({ isActive: true }),
      UserSubscription.find().populate('plan', 'name code price currency interval'),
    ]);

    const counts = {
      users: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      admin: users.filter((u) => u.role === 'admin').length,
      doctor: users.filter((u) => u.role === 'doctor').length,
      patient: users.filter((u) => u.role === 'patient').length,
      diabetes: users.filter((u) => u.hasDiabetes).length,
      women: users.filter((u) => u.gender === 'woman').length,
      men: users.filter((u) => u.gender === 'man').length,
      plans: plans.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === 'active' || s.status === 'trial')
        .length,
    };

    const mrr = subscriptions
      .filter((s) => (s.status === 'active' || s.status === 'trial') && s.plan)
      .reduce((sum, s) => {
        const price = s.plan.price || 0;
        if (s.plan.interval === 'yearly') return sum + price / 12;
        if (s.plan.interval === 'lifetime') return sum;
        return sum + price;
      }, 0);

    res.json({ counts, mrr: Math.round(mrr * 100) / 100, currency: 'MAD' });
  } catch (error) {
    console.error('admin overview:', error);
    res.status(500).json({ message: 'Failed to load overview' });
  }
};

/** ---------- Users ---------- */
exports.listUsers = async (req, res) => {
  try {
    const includeInactive = req.query.all === '1';
    const filter = includeInactive ? {} : { isActive: true };
    const users = await User.find(filter)
      .select(
        'firstName lastName email role gender hasDiabetes diabetesType specialty phone assignedDoctor isActive createdAt'
      )
      .populate('assignedDoctor', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const subs = await UserSubscription.find({
      user: { $in: users.map((u) => u._id) },
      status: { $in: ['active', 'trial'] },
    }).populate('plan', 'name code price currency interval');

    const subByUser = Object.fromEntries(subs.map((s) => [String(s.user), s]));

    res.json({
      users: users.map((u) => ({
        ...u.toObject(),
        subscription: subByUser[String(u._id)] || null,
      })),
    });
  } catch (error) {
    console.error('admin listUsers:', error);
    res.status(500).json({ message: 'Failed to load users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      gender,
      phone,
      specialty,
      hasDiabetes,
      diabetesType,
      assignedDoctor,
      isActive,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'firstName, lastName, email, password required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const safeRole = ['patient', 'doctor', 'admin'].includes(role) ? role : 'patient';
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: safeRole,
      gender: gender === 'man' ? 'man' : 'woman',
      phone: phone || '',
      specialty: safeRole === 'doctor' ? specialty || 'General medicine' : '',
      hasDiabetes: Boolean(hasDiabetes),
      diabetesType: hasDiabetes ? diabetesType || 'type2' : 'none',
      assignedDoctor: assignedDoctor || null,
      isActive: isActive !== false,
    });

    if (user.role === 'patient') {
      await HealthRecord.create({ patient: user._id });
    }

    res.status(201).json({ user: user.toSafeJSON() });
  } catch (error) {
    console.error('admin createUser:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      firstName,
      lastName,
      email,
      role,
      gender,
      phone,
      specialty,
      hasDiabetes,
      diabetesType,
      assignedDoctor,
      isActive,
      password,
    } = req.body;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email.toLowerCase();
    if (role !== undefined && ['patient', 'doctor', 'admin'].includes(role)) user.role = role;
    if (gender !== undefined) user.gender = gender === 'man' ? 'man' : 'woman';
    if (phone !== undefined) user.phone = phone;
    if (specialty !== undefined) user.specialty = specialty;
    if (hasDiabetes !== undefined) user.hasDiabetes = Boolean(hasDiabetes);
    if (diabetesType !== undefined) user.diabetesType = diabetesType;
    if (assignedDoctor !== undefined) user.assignedDoctor = assignedDoctor || null;
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (password && String(password).length >= 6) user.password = password;

    // Prevent locking yourself out
    if (String(user._id) === String(req.user._id) && user.isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    if (String(user._id) === String(req.user._id) && user.role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    await user.save();
    res.json({ user: user.toSafeJSON() });
  } catch (error) {
    console.error('admin updateUser:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = false;
    await user.save();

    await UserSubscription.updateMany(
      { user: user._id, status: { $in: ['active', 'trial'] } },
      { status: 'cancelled', autoRenew: false }
    );

    res.json({ message: 'User deactivated', user: user.toSafeJSON() });
  } catch (error) {
    console.error('admin deleteUser:', error);
    res.status(500).json({ message: 'Failed to deactivate user' });
  }
};

/** ---------- Plans ---------- */
exports.listPlans = async (_req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ sortOrder: 1, price: 1 });
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load plans' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ plan });
  } catch (error) {
    console.error('admin createPlan:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Plan code already exists' });
    }
    res.status(500).json({ message: 'Failed to create plan' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ plan });
  } catch (error) {
    console.error('admin updatePlan:', error);
    res.status(500).json({ message: 'Failed to update plan' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const activeSubs = await UserSubscription.countDocuments({
      plan: plan._id,
      status: { $in: ['active', 'trial'] },
    });
    if (activeSubs > 0) {
      plan.isActive = false;
      await plan.save();
      return res.json({
        plan,
        message: 'Plan has active subscribers — marked inactive instead of deleted',
      });
    }

    await plan.deleteOne();
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete plan' });
  }
};

/** ---------- Subscriptions ---------- */
exports.listSubscriptions = async (_req, res) => {
  try {
    const subscriptions = await UserSubscription.find()
      .populate('user', 'firstName lastName email role isActive')
      .populate('plan', 'name code price currency interval')
      .populate('managedBy', 'firstName lastName')
      .sort({ updatedAt: -1 });
    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load subscriptions' });
  }
};

exports.assignSubscription = async (req, res) => {
  try {
    const { userId, planId, status, endDate, autoRenew, notes, startDate } = req.body;
    if (!userId || !planId) {
      return res.status(400).json({ message: 'userId and planId are required' });
    }

    const [user, plan] = await Promise.all([
      User.findById(userId),
      SubscriptionPlan.findById(planId),
    ]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // Cancel previous active/trial
    await UserSubscription.updateMany(
      { user: userId, status: { $in: ['active', 'trial'] } },
      { status: 'cancelled', autoRenew: false }
    );

    const start = startDate ? new Date(startDate) : new Date();
    const sub = await UserSubscription.create({
      user: userId,
      plan: planId,
      status: ['active', 'trial', 'cancelled', 'expired', 'past_due'].includes(status)
        ? status
        : 'active',
      startDate: start,
      endDate: endDate ? new Date(endDate) : endDateForPlan(plan, start),
      autoRenew: autoRenew !== false,
      notes: notes || '',
      managedBy: req.user._id,
    });

    const populated = await UserSubscription.findById(sub._id)
      .populate('user', 'firstName lastName email role')
      .populate('plan', 'name code price currency interval');

    res.status(201).json({ subscription: populated });
  } catch (error) {
    console.error('admin assignSubscription:', error);
    res.status(500).json({ message: 'Failed to assign subscription' });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const sub = await UserSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    const { planId, status, endDate, autoRenew, notes, startDate } = req.body;

    if (planId) {
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) return res.status(404).json({ message: 'Plan not found' });
      sub.plan = planId;
      if (!endDate && !sub.endDate) sub.endDate = endDateForPlan(plan);
    }
    if (status !== undefined) sub.status = status;
    if (endDate !== undefined) sub.endDate = endDate ? new Date(endDate) : null;
    if (startDate !== undefined) sub.startDate = new Date(startDate);
    if (autoRenew !== undefined) sub.autoRenew = Boolean(autoRenew);
    if (notes !== undefined) sub.notes = notes;
    sub.managedBy = req.user._id;

    await sub.save();

    const populated = await UserSubscription.findById(sub._id)
      .populate('user', 'firstName lastName email role')
      .populate('plan', 'name code price currency interval');

    res.json({ subscription: populated });
  } catch (error) {
    console.error('admin updateSubscription:', error);
    res.status(500).json({ message: 'Failed to update subscription' });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const sub = await UserSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    sub.status = 'cancelled';
    sub.autoRenew = false;
    sub.managedBy = req.user._id;
    if (req.body.notes) sub.notes = req.body.notes;
    await sub.save();

    const populated = await UserSubscription.findById(sub._id)
      .populate('user', 'firstName lastName email role')
      .populate('plan', 'name code price currency interval');

    res.json({ subscription: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
};
