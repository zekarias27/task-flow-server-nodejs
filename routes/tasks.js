const express = require('express');
const { User, Task } = require('../mongodb/model'); 
const router = express.Router();
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');


router.get('/:userId/tasks', async (req, res) => {
  const userId = req.params.userId;
  console.log('userId received in GET /:userId/tasks:', userId);

  try {
    const user = await User.findOne({ email: userId }).populate('tasks');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ tasks: user.tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a new task
router.post('/:userId/tasks', async (req, res) => {
  const userId = req.params.userId;
  console.log('userId received in POST /:userId/tasks:', userId);
  const { task, taskDetails, category, due, duration, delegate, important } = req.body;

  try {
    const user = await User.findOne({ email: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newTask = new Task({
      id: uuidv4(),
      task,
      taskDetails,
      category,
      due,
      duration,
      delegate,
      important,
      completed: false,
      createdAt: moment().toDate(),
      updatedAt: moment().toDate()
    });

    await newTask.save();

    user.tasks.push(newTask);
    await user.save();

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.patch('/:userId/tasks/:taskId', async (req, res) => {
  const userId = req.params.userId;
  const taskId = req.params.taskId;
  console.log('userId received in PATCH /:userId/tasks/:taskId:', userId); 
  const updatedTaskData = req.body;

  try {
    const user = await User.findOne({ email: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.findOne({ id: taskId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    Object.assign(task, updatedTaskData, { updatedAt: moment().toDate() });
    await task.save();

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.patch('/:userId/tasks/:taskId/complete', async (req, res) => {
  const userId = req.params.userId;
  const taskId = req.params.taskId;
  console.log('userId received in PATCH /:userId/tasks/:taskId/complete:', userId); // Log userId

  try {
    const user = await User.findOne({ email: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.findOne({ id: taskId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = true;
    task.updatedAt = moment().toDate();
    await task.save();

    res.json(task);
  } catch (error) {
    console.error('Error marking task as completed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/:userId/tasks/:taskId', async (req, res) => {
  const userId = req.params.userId;
  const taskId = req.params.taskId;
  console.log('userId received in DELETE /:userId/tasks/:taskId:', userId); // Log userId

  try {
    const user = await User.findOne({ email: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = await Task.findOne({ id: taskId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Remove the task from the user's tasks array
    user.tasks.pull(task._id);
    await user.save();

    // Delete the task from the Task collection
    await Task.deleteOne({ id: taskId });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/:userId/tasks/completed/:date', async (req, res) => {
  const userId = req.params.userId;
  const date = req.params.date;
  console.log('userId received in GET /:userId/tasks/completed/:date:', userId); // Log userId
  console.log('date received in GET /:userId/tasks/completed/:date:', date); // Log date

  try {
    const user = await User.findOne({ email: userId }).populate({
      path: 'tasks',
      match: { completed: true, updatedAt: { $gte: moment(date).startOf('day').toDate(), $lt: moment(date).endOf('day').toDate() } }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ tasks: user.tasks });
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
