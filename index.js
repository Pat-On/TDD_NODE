const app = require('./src/app.js');
// console.log(app);
const sequelize = require('./src/config/database');

sequelize.sync({ force: true }); // <- Does not work! (1st test failing?)
// sequelize.sync();

app.listen(3000, () => console.log('app is running!'));
