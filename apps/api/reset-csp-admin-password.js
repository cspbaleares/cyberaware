const argon2=require('argon2');
const {PrismaClient}=require('@prisma/client');
const prisma=new PrismaClient();
(async()=>{
  const tenant=await prisma.tenant.findFirst({where:{slug:'csp-baleares',deletedAt:null}});
  if(!tenant) throw new Error('tenant not found');
  const user=await prisma.user.findFirst({where:{tenantId:tenant.id,email:'administracion@cspbaleares.com',deletedAt:null}});
  if(!user) throw new Error('user not found');
  const hash=await argon2.hash(process.env.NEW_PASSWORD,{type:argon2.argon2id});
  await prisma.user.update({where:{id:user.id},data:{passwordHash:hash,passwordChangedAt:new Date(),mustChangePassword:false,failedLoginCount:0,lockedUntil:null}});
  console.log('OK password updated');
})().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>{await prisma.$disconnect()});
