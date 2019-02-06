const path = require(`path`);
const fs = require(`fs-extra`);
const { createFilePath } = require(`gatsby-source-filesystem`);
const { createFileNode } = require(`gatsby-source-filesystem/create-file-node`);

const gm = require("gm");

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;

  const blogPost = path.resolve(`./src/templates/blog-post.js`);
  return graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
      }
    `
  ).then(result => {
    if (result.errors) {
      throw result.errors;
    }

    // Create blog posts pages.
    const posts = result.data.allMarkdownRemark.edges;

    posts.forEach((post, index) => {
      const previous =
        index === posts.length - 1 ? null : posts[index + 1].node;
      const next = index === 0 ? null : posts[index - 1].node;

      createPage({
        path: post.node.fields.slug,
        component: blogPost,
        context: {
          slug: post.node.fields.slug,
          previous,
          next
        }
      });
    });
  });
};

exports.onCreateNode = async ({
  node,
  actions,
  getNode,
  store,
  createNodeId
}) => {
  const { createNode, createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value
    });

    const CACHE_DIR = `.cache`;
    const FS_PLUGIN_DIR = `gatsby-transformer-banner-generator`;

    const pluginCacheDir = path.join(
      store.getState().program.directory,
      CACHE_DIR,
      FS_PLUGIN_DIR
    );

    console.log(pluginCacheDir);
    fs.ensureDir(pluginCacheDir);

    const imgPath = pluginCacheDir + node.id + ".jpg";
    await asnycGm(node.frontmatter.title, imgPath);

    const fileNode = await createFileNode(imgPath, createNodeId, {});

    fileNode.internal.description = `Banner for "${value}"`;

    await createNode(fileNode, {
      name: `gatsby-source-filesystem`
    });

    await createNodeField({
      name: `banner`,
      node,
      value: path.join("../../..", fileNode.relativePath)
    });
  }
};

function gmWrapper(text, path) {
  return new Promise(resolve => {
    gm(1920, 1080, "#ffffff")
      .region(1920, 1080, 0, 0)
      .gravity("Center")
      .fill("#000000")
      .font("BebasNeue-Bold.ttf", 144)
      .drawText(0, 0, text)
      .write(path, function(err) {
        if (err) {
          reject(error);
        }
        resolve(path);
      });
  });
}

async function asnycGm(text, path) {
  return gmWrapper(text, path);
}
