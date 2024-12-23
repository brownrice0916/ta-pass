const AdminLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <>
      <h1>admin Page입니다</h1>
      {children}
    </>
  );
};

export default AdminLayout;
