import React from 'react';

const CommentBlock = (props: { comment: string }): React.ReactNode => {
  if (props.comment.length === 0) return <></>;
  if (props.comment.includes('\n')) {
    const lines = props.comment.split('\n');
    return (
      <>
        <span className="text-[#a9bcbc]">
          /**
          <br />
          {lines.map((line, index) => (
            <>
              {index !== 0 && <br />}
              &nbsp;* {line}
            </>
          ))}
          <br />
          &nbsp;*/
        </span>
        <br />
      </>
    );
  }
  return (
    <>
      <span className="text-[#a9bcbc]">// {props.comment}</span>
      <br />
    </>
  );
};

export default CommentBlock;
