/*
 * Copyright (C) 2003-2014 eXo Platform SAS.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
package org.exoplatform.wiki.data.converter;

import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.util.LinkedList;
import java.util.Queue;

import javax.annotation.security.RolesAllowed;
import javax.jcr.Node;
import javax.jcr.NodeIterator;
import javax.jcr.PathNotFoundException;
import javax.jcr.RepositoryException;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.chromattic.api.ChromatticSession;
import org.exoplatform.portal.config.UserACL;
import org.exoplatform.services.jcr.RepositoryService;
import org.exoplatform.services.jcr.ext.app.SessionProviderService;
import org.exoplatform.services.log.ExoLogger;
import org.exoplatform.services.log.Log;
import org.exoplatform.services.rest.resource.ResourceContainer;
import org.exoplatform.wiki.mow.api.Page;
import org.exoplatform.wiki.mow.api.WikiNodeType;
import org.exoplatform.wiki.mow.api.WikiType;
import org.exoplatform.wiki.mow.core.api.MOWService;
import org.exoplatform.wiki.mow.core.api.wiki.AttachmentImpl;
import org.exoplatform.wiki.mow.core.api.wiki.PageImpl;
import org.exoplatform.wiki.rendering.util.Utils;
import org.exoplatform.wiki.service.WikiResource;

/**
 * Converted wiki tree, change nt:folder to wiki:page, <br/>
 *                             nt:file   to wiki:attachment
 * 
 * Created by The eXo Platform SAS
 * Author : eXoPlatform
 *          exo@exoplatform.com
 * Jan 20, 2014  
 */
@Path("/wikidata")
public class WikiDataConverter implements ResourceContainer {
  
  private static final String NT_FOLDER = "nt:folder";
  private static final String NT_FILE = "nt:file";
  private static final String JCR_MIMETYPE = "jcr:mimeType";
  private static final String EXO_OWNER = "exo:owner";

  private final CacheControl cc;
  
  private static Log             LOG = ExoLogger.getLogger(WikiDataConverter.class.getName());
  
  private RepositoryService repoService_;
  
  private SessionProviderService sessionProviderService_;
  
  private MOWService mowService_;
  
  public WikiDataConverter(RepositoryService repoService, 
                           SessionProviderService sessionProviderService,
                           MOWService mowService) {
    this.repoService_ = repoService;
    this.sessionProviderService_ = sessionProviderService;
    this.mowService_ = mowService;
    cc = new CacheControl();
    cc.setNoCache(true);
    cc.setNoStore(true);
  }
  
  /**
   * Converts data copied by WebDav, from incorrect WIKI data type to correct one:<br/>
   * nt:folder
   * 
   * @param src
   * @param destination
   * @return
   */
  @GET
  @Path("/convert/")
  @Produces(MediaType.APPLICATION_JSON)
  @RolesAllowed("users")
  public Response convertData(@QueryParam("srcWs") String srcWs,
                              @QueryParam("srcPath") String srcPath,
                              @QueryParam("space") String space) {
    try {
      long startTime = System.currentTimeMillis();
      Node sourceNode = getNode(srcWs, srcPath);
      String prettyName = createSpace(space);
      createWikiHome(prettyName);
      Node targetNode = getTargetNode(prettyName);
      createWikiPages(sourceNode, targetNode);
      long time = System.currentTimeMillis() - startTime;
      if (LOG.isInfoEnabled()) {
        LOG.info("Converting time = " + (time/1000.0) + " (s) = " + (time/1000.0/60) + " (minutes)");
      }
      return Response.ok("data converted successfully!", MediaType.TEXT_PLAIN).cacheControl(cc).build();
    } catch (Exception e) {
      if (LOG.isErrorEnabled()) {
        LOG.error("Can not convert wiki data from " + srcWs + ":" + srcPath +
                  " to " + space + " space", e);
      }
      return Response.serverError().entity(e.getMessage()).cacheControl(cc).build();
    }
  }
  
  /**
   * Gets node by workspace and path
   * @param ws the workspace
   * @param path the path
   * @return the node
   * @throws PathNotFoundException
   * @throws RepositoryException
   */
  private Node getNode(String ws, String path) throws PathNotFoundException, RepositoryException {
    return (Node) mowService_.getSession().getJCRSession().getItem(path);
  }
  
  /**
   * Creates new space
   * @param spaceName name of the space
   * @return pretty name of new created space
   * @throws ClassNotFoundException
   * @throws IllegalArgumentException
   * @throws SecurityException
   * @throws InstantiationException
   * @throws IllegalAccessException
   * @throws InvocationTargetException
   * @throws NoSuchMethodException
   * @throws NoSuchFieldException
   */
  private String createSpace(String spaceName) 
      throws ClassNotFoundException, IllegalArgumentException, SecurityException, 
             InstantiationException, IllegalAccessException, InvocationTargetException, 
             NoSuchMethodException, NoSuchFieldException {
    Class spaceServiceClass = Class.forName("org.exoplatform.social.core.space.spi.SpaceService");
    Object spaceService = Utils.getService(spaceServiceClass);
    //check if space already exists
    Object spaceObj = null;
    try {
      //get space pretty name
      Class spaceUtilsClass = Class.forName("org.exoplatform.social.core.space.SpaceUtils");
      Object prettyName = spaceUtilsClass.getDeclaredMethod("cleanString", String.class).invoke(null, spaceName);
      spaceObj = spaceServiceClass.getDeclaredMethod("getSpaceByPrettyName", String.class)
                                         .invoke(spaceService, (String)prettyName);
    } catch (IllegalArgumentException e) {
      spaceObj = null;
    } catch (SecurityException e) {
      spaceObj = null;
    } catch (IllegalAccessException e) {
      spaceObj = null;
    } catch (InvocationTargetException e) {
      spaceObj = null;
    } catch (NoSuchMethodException e) {
      spaceObj = null;
    }
    Class spaceClass = Class.forName("org.exoplatform.social.core.space.model.Space");
    if (spaceObj != null) {
      return (String)spaceClass.getDeclaredMethod("getPrettyName").invoke(spaceObj);
    }
    //create new space
    Class defaultSpaceApplicationHandlerClass 
                     = Class.forName("org.exoplatform.social.core.space.impl.DefaultSpaceApplicationHandler");
    spaceObj = spaceClass.getConstructor().newInstance();
    //space.setDisplayName(spaceName);
    spaceClass.getDeclaredMethod("setDisplayName", String.class).invoke(spaceObj, spaceName);
    //space.setPrettyName(spaceName);
    spaceClass.getDeclaredMethod("setPrettyName", String.class).invoke(spaceObj, spaceName);
    //space.setGroupId("/spaces/" + space.getPrettyName());
    spaceClass.getDeclaredMethod("setGroupId", String.class).invoke(spaceObj, "/spaces/" + spaceName);
    //space.setRegistration(Space.OPEN);
    spaceClass.getDeclaredMethod("setRegistration", String.class)
              .invoke(spaceObj, spaceClass.getDeclaredField("OPEN").get(null));
    //space.setDescription(lorem.getWords(10));
    spaceClass.getDeclaredMethod("setDescription", String.class).invoke(spaceObj, "");
    //space.setType(DefaultSpaceApplicationHandler.NAME);
    spaceClass.getDeclaredMethod("setType", String.class)
              .invoke(spaceObj, defaultSpaceApplicationHandlerClass.getField("NAME").get(null));
    //space.setVisibility(Space.PRIVATE);
    spaceClass.getDeclaredMethod("setVisibility", String.class)
              .invoke(spaceObj, spaceClass.getDeclaredField("PUBLIC").get(null));
    //space.setRegistration(Space.OPEN);
    spaceClass.getDeclaredMethod("setRegistration", String.class)
              .invoke(spaceObj, spaceClass.getDeclaredField("OPEN").get(null));
    //space.setPriority(Space.INTERMEDIATE_PRIORITY);
    spaceClass.getDeclaredMethod("setPriority", String.class)
              .invoke(spaceObj, spaceClass.getDeclaredField("INTERMEDIATE_PRIORITY").get(null));

    spaceObj = spaceServiceClass.getDeclaredMethod("createSpace", spaceClass, String.class)
                       .invoke(spaceService, spaceObj, Utils.getService(UserACL.class).getSuperUser());
    return (String)spaceClass.getDeclaredMethod("getPrettyName").invoke(spaceObj);
  }
  
  /**
   * Creates the wikiHome page
   * @param spaceName name of the space
   */
  private Page createWikiHome(String spaceName) {
    return mowService_.getModel().getWikiStore().getWikiContainer(WikiType.GROUP)
                      .getWiki("/spaces/" + spaceName, true)
                      .getWikiHome();
  }
  
  /**
   * Gets the wiki home node of given space 
   * @param spaceName name of the space
   * @return the wiki home node
   * @throws Exception
   */
  private Node getTargetNode(String spaceName) throws Exception {
    return createWikiHome(spaceName).getJCRPageNode();
  }
  
  private PageImpl createWikiPages(Node srcNode, Node targetNode) throws Exception {
    ChromatticSession session = mowService_.getSession();
    PageImpl targetPage = null;
    Queue<Node> srcs = new LinkedList<Node>();
    srcs.add(srcNode);
    Queue<Node> targets = new LinkedList<Node>();
    targets.add(targetNode);
    while (!srcs.isEmpty()) {
      Node src = srcs.poll();
      Node target = targets.poll();
      if (LOG.isInfoEnabled()) {
        LOG.info("Converting " + src.getPath() + " ...");
      }
      targetPage = session.findByNode(PageImpl.class, target);
      if (src.hasNode(WikiNodeType.Definition.CONTENT) && target.hasNode(WikiNodeType.Definition.CONTENT)) {
        //create wiki page content
        targetPage.getContent().setText(
          src.getNode(WikiNodeType.Definition.CONTENT)
             .getNode(WikiNodeType.Definition.ATTACHMENT_CONTENT)
             .getProperty(WikiNodeType.Definition.DATA).getString());
        session.save();
      }
      NodeIterator nodeIter = src.getNodes();
      while (nodeIter.hasNext()) {
        Node childNode = nodeIter.nextNode();
        if (childNode.isNodeType(NT_FOLDER)) {//create sub page
          PageImpl childPage = targetPage.getWikiPage(childNode.getName());
          if (childPage == null) {
            childPage = session.create(PageImpl.class, childNode.getName());
            targetPage.addWikiPage(childPage);
            childPage.getContent().setText("");
            if (childNode.hasProperty(EXO_OWNER)) {
              childPage.setOwner(childNode.getProperty(EXO_OWNER).getString());
            }
            childPage.makeVersionable();
//            childPage.checkin();
//            childPage.checkout();
            session.save();
          }
          //createWikiPages(childNode, childPage.getJCRPageNode());
          srcs.add(childNode);
          targets.add(childPage.getJCRPageNode());
        } else if (childNode.isNodeType(NT_FILE) && !WikiNodeType.Definition.CONTENT.equals(childNode.getName())) {
          if (targetPage.getAttachment(childNode.getName()) == null) {
            //create attachment
            InputStream is = childNode.getNode(WikiNodeType.Definition.ATTACHMENT_CONTENT)
                                      .getProperty(WikiNodeType.Definition.DATA).getStream();
            String mimeType = childNode.getNode(WikiNodeType.Definition.ATTACHMENT_CONTENT)
                                       .getProperty(JCR_MIMETYPE).getString();
            byte[] imageBytes = new byte[is.available()];
            is.read(imageBytes);
            WikiResource attachfile = new WikiResource(mimeType, "UTF-8", imageBytes);
            attachfile.setName(childNode.getName());
            
            AttachmentImpl att = targetPage.createAttachment(attachfile.getName(), attachfile);
            session.save();
          }
        }
      }
    }
    return targetPage;
  }

}
