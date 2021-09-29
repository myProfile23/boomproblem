"use strict";

const { sanitizeEntity } = require("strapi-utils");
const mysql = require("mysql");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "boomproblem",
});

module.exports = {
  async update(ctx) {
    const { id } = ctx.params;

    const findTask = await strapi.services.task.findOne({ id });

    const updateXp = ctx.request.body.xp;
    const updateName = ctx.request.body.name;
    const updateDescription = ctx.request.body.description;

    if (updateName || updateDescription || updateXp) {
      console.log(ctx.request.body);

      findTask.name = updateName ? updateName : findTask.name;
      findTask.description = updateDescription
        ? updateDescription
        : findTask.description;

      if (updateXp) {
        const diff =
          updateXp > findTask.xp
            ? -Math.abs(updateXp - findTask.xp)
            : +Math.abs(updateXp - findTask.xp);
        findTask.users.map((user) =>
          db.query(
            `update boomproblem.\`users-permissions_user\` set gained_xp = ${
              user.gained_xp - diff
            } where id = ${user.id}`,
            function (err, result) {
              if (err) throw err;
              console.log(result);
            }
          )
        );
        findTask.xp = updateXp;

        // console.log(findTask);
      }
      await strapi.services.task.update({ id }, findTask);
      return "Task updated";
    }
    console.log("Missing fields");
    return "Missing fields", findTask;
  },
  async completeTask(ctx) {
    let entity;

    const { id } = ctx.params;

    // console.log(ctx);

    const user = ctx.state.user;

    // console.log(user);

    const strapiUser = await strapi
      .query("user", "users-permissions")
      .findOne({ id: user.id });

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
          strapiUser.gained_xp = strapiUser.gained_xp + ctx.request.body.xp;

          // console.log(strapiUser);

          completedTask.users.push(strapiUser.id);
          strapiUser.tasks.push(completedTask.id);

          console.log(completedTask);

          entity = completedTask;

          entity = await strapi.services.task.update({ id }, completedTask);
          console.log("Task Completed");

          await strapi
            .query("user", "users-permissions")
            .update({ id: user.id }, strapiUser);

          console.log(strapiUser);

          //console.log(user);

          return "Congrats your task is submitted";
        }
      } else {
        return "The submitted task is wrong! Check it and try again. Good luck!";
      }
    } else {
      return "Task Missing";
    }
  },
  async delete(ctx) {
    const { id } = ctx.params;
    const findTask = await strapi.services.task.findOne({ id });

    findTask.users.map((user) =>
      db.query(
        `update boomproblem.\`users-permissions_user\` set gained_xp = ${
          user.gained_xp - findTask.xp
        } where id = ${user.id}`,
        function (err, result) {
          if (err) throw err;
          console.log(result);
        }
      )
    );

    const entity = await strapi.services.task.delete({ id });
    console.log(findTask);
    console.log(entity);
    return "Task deleted";
    //sanitizeEntity(entity, { model: strapi.models.task });
  },
  async myCompletedTasks(ctx) {
    const user = ctx.state.user;
    const strapiUser = await strapi
      .query("user", "users-permissions")
      .findOne({ id: user.id });
    console.log(strapiUser.tasks);
    return [
      "Completed tasks",
      strapiUser.tasks.map((completedTask) =>
        sanitizeEntity(completedTask, { model: strapi.models.task })
      ),
    ];
  },
};
