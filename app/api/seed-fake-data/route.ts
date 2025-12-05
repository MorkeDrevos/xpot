// app/api/seed-fake-data/route.ts

const user = await prisma.user.create({
  data: {
    // temporarily no xId/xHandle/xName/xAvatarUrl here
  },
});
