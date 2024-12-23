type props = {
  params: {
    id: number;
  };
};
const PostDetailPage = ({ params }: props) => {
  return <>ID:{params.id}Page</>;
};

export default PostDetailPage;
