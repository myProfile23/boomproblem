"use strict";

const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async updateComplete(ctx) {
    let entity;

    const { id } = ctx.params;

    // console.log(ctx);

    const user = ctx.state.user;

    const strapiUser = await strapi
      .query("user", "users-permissions")
      .findOne(user.id);

    const completedTask = await strapi.services.task.findOne(ctx.params);

    const isCompleted = strapiUser.tasks.map((task) => task.id === Number(id));

    console.log(isCompleted.includes(true));

    if (completedTask) {
      if (
        ctx.request.body.name === completedTask.name &&
        ctx.request.body.description === completedTask.description &&
        ctx.request.body.xp === completedTask.xp
      ) {
        if (isCompleted.includes(true)) {
          return "Task is already completed";
        } else {
          user.gained_xp = user.gained_xp + ctx.request.body.xp;

          completedTask.users.push(user.id);

          entity = completedTask;

          entity = await strapi.services.task.update({ id }, completedTask);
          console.log("Task Completed");

          await strapi.query("user", "users-permissions").update(user.id, user);

          console.log(user);

          return "Congrats your task is submitted";
        }
      } else {
        return "The submitted task is wrong! Check it and try again. Good luck!";
      }
    } else {
      return "task misiing";
    }
  },

  async findOneComplete(ctx) {
    const { id } = ctx.params;

    const user = ctx.state.user;

    const strapiUser = await strapi
      .query("user", "users-permissions")
      .findOne(user.id);

    //const completedTask = await strapi.services.task.findOne(ctx.params);

    const findCompleted = strapiUser.tasks.map(
      (task) => task.id === Number(id)
    );

    if (!findCompleted.includes(true)) {
      return "This task it's not completed yet";
    } else {
      const entity = await strapi.services.task.findOne({ id });

      return sanitizeEntity(entity, { model: strapi.models.task });
    }
  },
  async findCompleted(ctx) {
    const user = ctx.state.user;

    const strapiUser = await strapi
      .query("user", "users-permissions")
      .findOne(user.id);

    console.log(strapiUser.tasks);

    return strapiUser.tasks.map((completedTask) =>
      sanitizeEntity(completedTask, { model: strapi.models.task })
    );
  },
};
